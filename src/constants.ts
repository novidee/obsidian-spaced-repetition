// To cater for both LF and CR-LF line ending styles, "\r?\n" is used to match the newline character sequence
// https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/776
export const SCHEDULING_INFO_REGEX =
    /^---\r?\n((?:.*\r?\n)*)sr-due: (.+)\r?\nsr-interval: (\d+)\r?\nsr-ease: (\d+)\r?\n((?:.*\r?\n)?)---/;
export const YAML_FRONT_MATTER_REGEX = /^---\r?\n((?:.*\r?\n)*?)---/;
export const NON_LETTER_SYMBOLS_REGEX = /[!-/:-@[-`{-~}\s]/g;

export const MULTI_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
export const LEGACY_SCHEDULING_EXTRACTOR = /<!--SR:([\d-]+),(\d+),(\d+)-->/gm;
export const OBSIDIAN_TAG_AT_STARTOFLINE_REGEX = /^#[^\s#]+/gi;

// https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link+to+a+block+in+a+note
// Block identifiers can only consist of letters, numbers, and dashes.
// RZ: 2024-01-01 Empirically determined that obsidian only recognizes a block identifier if the
// "^" is preceded by a space
export const OBSIDIAN_BLOCK_ID_ENDOFLINE_REGEX = / (\^[a-zA-Z0-9-]+)$/;

export const PREFERRED_DATE_FORMAT = "YYYY-MM-DD";
export const ALLOWED_DATE_FORMATS = [PREFERRED_DATE_FORMAT, "DD-MM-YYYY", "ddd MMM DD YYYY"];

export const IMAGE_FORMATS = [
    "jpg",
    "jpeg",
    "gif",
    "png",
    "svg",
    "webp",
    "apng",
    "avif",
    "jfif",
    "pjpeg",
    "pjp",
    "bmp",
];
export const AUDIO_FORMATS = ["mp3", "webm", "m4a", "wav", "ogg"];
export const VIDEO_FORMATS = ["mp4", "mkv", "avi", "mov"];

export const COLLAPSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
export const TICKS_PER_DAY = 24 * 3600 * 1000;

export const SR_HTML_COMMENT_BEGIN = "<!--SR:";
export const SR_HTML_COMMENT_END = "-->";
