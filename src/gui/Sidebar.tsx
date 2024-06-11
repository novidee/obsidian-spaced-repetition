import { ItemView, WorkspaceLeaf, TFile, Menu, setTooltip } from "obsidian";

import type SRPlugin from "src/main";
import { COLLAPSE_ICON } from "src/constants";
import { ReviewDeck } from "src/ReviewDeck";
import { t } from "src/lang/helpers";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private plugin: SRPlugin;
    private notesByDateCount: Record<string, number>;

    constructor(leaf: WorkspaceLeaf, plugin: SRPlugin) {
        super(leaf);

        this.plugin = plugin;
        this.registerEvent(this.app.workspace.on("file-open", () => this.redraw()));
        this.registerEvent(this.app.vault.on("rename", () => this.redraw()));

        this.notesByDateCount = {};
    }

    public getViewType(): string {
        return REVIEW_QUEUE_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return t("NOTES_REVIEW_QUEUE");
    }

    public getIcon(): string {
        return "SpacedRepIcon";
    }

    public onHeaderMenu(menu: Menu): void {
        menu.addItem((item) => {
            item.setTitle(t("CLOSE"))
                .setIcon("cross")
                .onClick(() => {
                    this.app.workspace.detachLeavesOfType(REVIEW_QUEUE_VIEW_TYPE);
                });
        });
    }

    private calculateNotesCount(): void {
        this.notesByDateCount = {};

        for (const deckKey in this.plugin.reviewDecks) {
            const deck: ReviewDeck = this.plugin.reviewDecks[deckKey];

            this.notesByDateCount[deck.deckName] =
                deck.newNotes.length + deck.scheduledNotes.length;

            if (deck.newNotes.length > 0) {
                this.notesByDateCount[t("NEW")] = deck.newNotes.length;
            }

            const now: number = Date.now();
            const maxDaysToRender: number = this.plugin.data.settings.maxNDaysNotesReviewQueue;
            let folderTitle = "";

            deck.scheduledNotes.forEach(note => {
                const nDays: number = Math.ceil((note.dueUnix - now) / (24 * 3600 * 1000));

                if (nDays > maxDaysToRender) {
                    return;
                }

                if (nDays === -1) {
                    folderTitle = t("YESTERDAY");
                } else if (nDays === 0) {
                    folderTitle = t("TODAY");
                } else if (nDays === 1) {
                    folderTitle = t("TOMORROW");
                } else {
                    folderTitle = new Date(note.dueUnix).toDateString();
                }

                if (this.notesByDateCount[folderTitle] !== undefined) {
                    this.notesByDateCount[folderTitle] += 1;
                } else {
                    this.notesByDateCount[folderTitle] = 1;
                }
            });
        }
    }

    public redraw(): void {
        const activeFile: TFile | null = this.app.workspace.getActiveFile();

        const rootEl: HTMLElement = createDiv("nav-folder mod-root");
        const childrenEl: HTMLElement = rootEl.createDiv("nav-folder-children");

        this.calculateNotesCount();

        for (const deckKey in this.plugin.reviewDecks) {
            const deck: ReviewDeck = this.plugin.reviewDecks[deckKey];

            const deckCollapsed = !deck.activeFolders.has(deck.deckName);

            const deckFolderEl: HTMLElement = this.createRightPaneFolder(
                childrenEl,
                deckKey,
                deckCollapsed,
                false,
                deck,
            ).getElementsByClassName("nav-folder-children")[0] as HTMLElement;

            if (deck.newNotes.length > 0) {
                const newNotesFolderEl: HTMLElement = this.createRightPaneFolder(
                    deckFolderEl,
                    t("NEW"),
                    !deck.activeFolders.has(t("NEW")),
                    deckCollapsed,
                    deck,
                );

                for (const newFile of deck.newNotes) {
                    const fileIsOpen = activeFile && newFile.path === activeFile.path;
                    if (fileIsOpen) {
                        deck.activeFolders.add(deck.deckName);
                        deck.activeFolders.add(t("NEW"));
                        this.changeFolderIconToExpanded(newNotesFolderEl);
                        this.changeFolderIconToExpanded(deckFolderEl);
                    }
                    this.createRightPaneFile(
                        newNotesFolderEl,
                        newFile,
                        fileIsOpen,
                        !deck.activeFolders.has(t("NEW")),
                        deck,
                        this.plugin,
                    );
                }
            }

            if (deck.scheduledNotes.length > 0) {
                const now: number = Date.now();
                let currUnix = -1;
                let schedFolderEl: HTMLElement | null = null,
                    folderTitle = "";
                const maxDaysToRender: number = this.plugin.data.settings.maxNDaysNotesReviewQueue;

                for (const sNote of deck.scheduledNotes) {
                    const nDays: number = Math.ceil((sNote.dueUnix - now) / (24 * 3600 * 1000));

                    if (nDays > maxDaysToRender) {
                        break;
                    }

                    if (nDays === -1) {
                        folderTitle = t("YESTERDAY");
                    } else if (nDays === 0) {
                        folderTitle = t("TODAY");
                    } else if (nDays === 1) {
                        folderTitle = t("TOMORROW");
                    } else {
                        folderTitle = new Date(sNote.dueUnix).toDateString();
                    }

                    if (sNote.dueUnix !== currUnix) {
                        schedFolderEl = this.createRightPaneFolder(
                            deckFolderEl,
                            folderTitle,
                            !deck.activeFolders.has(folderTitle),
                            deckCollapsed,
                            deck,
                        );
                        currUnix = sNote.dueUnix;
                    }

                    const fileIsOpen = activeFile && sNote.note.path === activeFile.path;
                    if (fileIsOpen) {
                        deck.activeFolders.add(deck.deckName);
                        deck.activeFolders.add(folderTitle);
                        this.changeFolderIconToExpanded(schedFolderEl);
                        this.changeFolderIconToExpanded(deckFolderEl);
                    }

                    this.createRightPaneFile(
                        schedFolderEl,
                        sNote.note,
                        fileIsOpen,
                        !deck.activeFolders.has(folderTitle),
                        deck,
                        this.plugin,
                    );
                }
            }
        }

        const contentEl: Element = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }

    private createRightPaneFolder(
        parentEl: HTMLElement,
        folderTitle: string,
        collapsed: boolean,
        hidden: boolean,
        deck: ReviewDeck,
    ): HTMLElement {
        const folderEl: HTMLDivElement = parentEl.createDiv("nav-folder");
        const folderTitleEl: HTMLDivElement = folderEl.createDiv("nav-folder-title");
        const childrenEl: HTMLDivElement = folderEl.createDiv("nav-folder-children");
        const collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
            "sr-nav-folder-collapse-indicator collapse-icon",
        );

        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed) {
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "rotate(-90deg)";
        }

        folderTitleEl.createDiv("nav-folder-title-content").setText(folderTitle);

        if (hidden) {
            folderEl.style.display = "none";
        }

        folderTitleEl.onClickEvent(() => {
            for (const child of childrenEl.childNodes as NodeListOf<HTMLElement>) {
                if (child.style.display === "block" || child.style.display === "") {
                    child.style.display = "none";
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                        "rotate(-90deg)";
                    deck.activeFolders.delete(folderTitle);
                } else {
                    child.style.display = "block";
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
                    deck.activeFolders.add(folderTitle);
                }
            }
        });

        setTooltip(folderTitleEl, `${this.notesByDateCount[folderTitle]} files`, {
            placement: "right",
        });

        return folderEl;
    }

    private createRightPaneFile(
        folderEl: HTMLElement,
        file: TFile,
        fileElActive: boolean,
        hidden: boolean,
        deck: ReviewDeck,
        plugin: SRPlugin,
    ): void {
        const navFileEl: HTMLElement = folderEl
            .getElementsByClassName("nav-folder-children")[0]
            .createDiv("nav-file");
        if (hidden) {
            navFileEl.style.display = "none";
        }

        const navFileTitle: HTMLElement = navFileEl.createDiv("nav-file-title");
        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }

        navFileTitle.createDiv("nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener(
            "click",
            async (event: MouseEvent) => {
                event.preventDefault();
                plugin.lastSelectedReviewDeck = deck.deckName;
                await this.app.workspace.getLeaf().openFile(file);
                return false;
            },
            false,
        );

        navFileTitle.addEventListener(
            "contextmenu",
            (event: MouseEvent) => {
                event.preventDefault();
                const fileMenu: Menu = new Menu();
                this.app.workspace.trigger("file-menu", fileMenu, file, "my-context-menu", null);
                fileMenu.showAtPosition({
                    x: event.pageX,
                    y: event.pageY,
                });
                return false;
            },
            false,
        );
    }

    private changeFolderIconToExpanded(folderEl: HTMLElement): void {
        const collapseIconEl = folderEl.find("div.sr-nav-folder-collapse-indicator");
        (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
    }
}
