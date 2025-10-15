import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { updateTickerData } from '../store/marketData';
/**
 * @nuxt/test-utils를 사용한 통합 테스트
 * - Nuxt 서버를 실제로 구동하여 테스트
 * - 실제 HTTP 요청처럼 API를 호출
 * - Nuxt 런타임 환경에서 모든 기능이 정상 작동
 */
describe('GET /api/tickers', () => {
    const baseURL = 'http://localhost:3000';

    // Nuxt 테스트 환경 설정 및 mock 데이터 준비
    beforeAll(async () => {
        console.log('Setting up test data...');
        console.log('NOTE: Make sure dev server is running at', baseURL);

        setup({
            server : true
            , host : 'http://localhost:3000'
        });

        // Upbit 테스트 데이터
        updateTickerData('upbit', 'KRW-BTC', {
            e: 'upbit',
            s: 'KRW-BTC',
            p: 70000000,
            d: 1,
            c24: 1.5,
            cp24: 1000000,
            p24: 100
        });

        // Binance 테스트 데이터
        updateTickerData('upbit', 'ETH-USDT', {
            e: 'upbit',
            s: 'ETH-USDT',
            p: 3000,
            d: -1,
            c24: -2.1,
            cp24: -65,
            p24: 2000
        });

        console.log('Test data setup complete.');
    }, 30000); // beforeAll 타임아웃을 30초로 설정



    // 각 테스트 후 데이터 정리 (선택사항)
    afterEach(() => {
        // 필요한 경우 테스트 데이터 정리
        // clearExchangeData('upbit');
        // clearExchangeData('binance');
    });

    it('should return tickers for specified symbols', async () => {
        // given: 'symbols' 쿼리 파라미터가 주어졌을 때
        const symbols = 'upbit:KRW-BTC,upbit:ETH-USDT';

        // when: API를 실제로 호출하면
        const result = await $fetch('/api/tickers', {
            query: { symbols }
        });

        // then: 지정된 심볼에 해당하는 티커 목록이 반환되어야 합니다.
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0].s).toBe('KRW-BTC');
        expect(result[0].e).toBe('upbit');
        expect(result[1].s).toBe('ETH-USDT');
        expect(result[1].e).toBe('upbit');
    });

    it('should filter out invalid or non-existent symbols', async () => {
        // given: 유효한 심볼과 유효하지 않은 심볼이 섞여 있을 때
        const symbols = 'upbit:KRW-BTC,upbit:KRW-DOGE'; // KRW-DOGE는 mock 데이터에 없음

        // when: API를 실제로 호출하면
        const result = await $fetch('/api/tickers', {
            query: { symbols }
        });

        // then: 유효한 심볼의 데이터만 반환되어야 합니다.
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0].s).toBe('KRW-BTC');
        expect(result[0].e).toBe('upbit');
    });

    it('should return an empty array if symbols parameter is not provided', async () => {
        // given: 'symbols' 쿼리 파라미터가 없을 때

        // when: API를 호출하면
        const result = await $fetch('/api/tickers');

        // then: 빈 배열이 반환되어야 합니다.
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
    });

    it('should handle whitespace in symbols parameter', async () => {
        // given: symbols 파라미터에 공백이 포함되어 있을 때
        const symbols = ' upbit:KRW-BTC , upbit:ETH-USDT ';

        // when: API를 호출하면
        const result = await $fetch('/api/tickers', {
            query: { symbols }
        });

        // then: 공백이 제거되고 정상적으로 처리되어야 합니다.
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0].s).toBe('KRW-BTC');
        expect(result[1].s).toBe('ETH-USDT');
    });

    it('should return only valid tickers when mixed with empty strings', async () => {
        // given: 빈 문자열이 섞여 있을 때
        const symbols = 'upbit:KRW-BTC,,upbit:ETH-USDT,';

        // when: API를 호출하면
        const result = await $fetch('/api/tickers', {
            query: { symbols }
        });

        // then: 빈 문자열은 무시되고 유효한 티커만 반환되어야 합니다.
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });
});