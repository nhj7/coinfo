/**
 * 밀리초(ms) 단위의 시간을 사람이 읽기 좋은 형식의 문자열로 변환합니다.
 * @param {number} ms - 변환할 시간 (밀리초)
 * @returns {string} "X일 Y시간 Z분 A초" 형식의 문자열
 * @example
 * formatDuration(176583000) // "2일 1시간 3분 3초"
 * formatDuration(3661000)   // "1시간 1분 1초"
 * formatDuration(0)         // "0초"
 */
export function formatDuration(ms: number | null): string {
    if (ms <= 0) {
        return "0초";
    }

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    if (seconds > 0 || parts.length === 0) { // 항상 최소한 초 단위는 표시
        parts.push(`${seconds}초`);
    }

    return parts.join(' ');
}