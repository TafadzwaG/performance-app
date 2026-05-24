export interface PasswordRule {
    id: string;
    label: string;
    test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { id: 'length', label: 'At least 8 characters', test: (password) => password.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'One lowercase letter', test: (password) => /[a-z]/.test(password) },
    { id: 'number', label: 'One number', test: (password) => /\d/.test(password) },
    { id: 'special', label: 'One special character (!@#$%^&*)', test: (password) => /[^A-Za-z0-9]/.test(password) },
];

export interface PasswordRuleResult extends PasswordRule {
    passed: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordRuleResult[] {
    return PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(password),
    }));
}

export function isPasswordStrong(password: string): boolean {
    return PASSWORD_RULES.every((rule) => rule.test(password));
}

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const NUMBERS = '23456789';
const SPECIAL = '!@#$%^&*';
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SPECIAL}`;

function shuffle<T>(values: T[]): T[] {
    const copy = [...values];

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
}

function randomCharacter(source: string): string {
    return source[Math.floor(Math.random() * source.length)];
}

export function generateStrongPassword(length = 16): string {
    const targetLength = Math.max(length, 8);
    const required = [
        randomCharacter(UPPERCASE),
        randomCharacter(LOWERCASE),
        randomCharacter(NUMBERS),
        randomCharacter(SPECIAL),
    ];
    const remaining = Array.from({ length: targetLength - required.length }, () => randomCharacter(ALL_CHARACTERS));

    return shuffle([...required, ...remaining]).join('');
}
