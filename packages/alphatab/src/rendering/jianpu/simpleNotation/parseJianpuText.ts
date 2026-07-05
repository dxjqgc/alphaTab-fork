/**
 * Parse jianpu display text (#n / bn / n / 0).
 * @internal
 */
export interface ParsedJianpuText {
    digit: string;
    upDownCount: number;
    isRest: boolean;
}

export function parseJianpuText(text: string): ParsedJianpuText {
    if (!text || text === '0') {
        return { digit: '0', upDownCount: 0, isRest: true };
    }

    if (text.startsWith('#')) {
        const digit = text.slice(1);
        return { digit: digit.length > 0 ? digit : text, upDownCount: 1, isRest: false };
    }

    if (text.startsWith('b')) {
        const digit = text.slice(1);
        return { digit: digit.length > 0 ? digit : text, upDownCount: -1, isRest: false };
    }

    return { digit: text, upDownCount: 0, isRest: false };
}
