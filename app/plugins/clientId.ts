import { defineNuxtPlugin, useCookie } from '#app';
import short from 'short-uuid';

/**
 * 클라이언트 식별자(cid)를 관리하는 Nuxt 플러그인.
 * 사용자가 cid 쿠키를 가지고 있지 않으면 새로 생성하여 설정합니다.
 * 이 cid는 Redis에서 사용자 설정을 조회하는 키로 사용됩니다.
 */
export default defineNuxtPlugin(() => {
    const cidCookie = useCookie('cid', {});

    if (!cidCookie.value) {
        // 쿠키가 없으면 새로운 UUID를 생성하여 할당
        cidCookie.value = short.generate();
        console.log(`[Plugin:clientId] New client ID generated: ${cidCookie.value}`);
    }
});