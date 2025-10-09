<script setup lang="ts">
// daisyUI에서 제공하는 모든 테마 목록입니다.
// (daisyUI v5 기준 35개 테마)
const themes: string[]  = ["light","dark","cupcake","bumblebee","emerald","corporate","synthwave","retro","cyberpunk","valentine","halloween","garden","forest","aqua","lofi","pastel","fantasy","wireframe","black","luxury","dracula","cmyk","autumn","business","acid","lemonade","night","coffee","winter","dim","nord","sunset","caramellatte","abyss","silk"];
// 테마 아이콘
const themeIcons: string[] = [
  "weather-sunny", "weather-night", "cupcake", "bee", "diamond-stone",
  "office-building", "sine-wave", "gamepad-variant", "robot-industrial", "heart",
  "pumpkin", "flower", "pine-tree", "water", "headphones",
  "palette", "castle", "vector-square", "circle", "crown",
  "bat", "printer-3d", "leaf-maple", "briefcase", "beaker",
  "glass-cocktail", "weather-night", "coffee", "snowflake", "brightness-6",
  "compass-outline", "weather-sunset", "coffee-to-go", "diving", "hanger"
];

const THEME_KEY = 'daisyui-theme';

// 시스템 테마를 감지하는 함수
const getSystemTheme = (): string => {
  if (import.meta.client) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// 전역 상태로 테마를 관리합니다
const currentTheme = ref<string>('dark');

// 드롭다운 표시 상태
const isDropdownVisible = ref<boolean>(false);



// HTML 문서의 <html> 태그에 data-theme 속성을 적용하고 localStorage에 저장하는 함수
const applyTheme = (theme: string) => {
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    currentTheme.value = theme;
  }
};

// currentTheme 값이 변경될 때마다 테마를 적용합니다.
watch(currentTheme, (newTheme) => {
  if (newTheme) {
    applyTheme(newTheme);
  }
});

onMounted(() => {
  // 드롭다운 표시
  isDropdownVisible.value = true;

  // localStorage에서 테마 읽기
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    currentTheme.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const systemTheme = getSystemTheme();
    applyTheme(systemTheme);
  }
});
// LNB Drawer 체크박스에 대한 템플릿 참조를 생성합니다.
const drawerToggle = ref<HTMLInputElement | null>(null);

// 모바일에서 메뉴 클릭 시 drawer를 닫는 함수입니다.
const closeDrawer = () => {
  if (drawerToggle.value) {
    drawerToggle.value.checked = false;
  }
};

// 현재 라우트 정보
//const route = useRoute();

// Breadcrumbs 생성
// const breadcrumbs = computed(() => {
//   const pathArray = route.path.split('/').filter(p => p);
//   const crumbs = [{ name: 'Home', path: '/' }];
//
//   let currentPath = '';
//   pathArray.forEach(segment => {
//     currentPath += `/${segment}`;
//     crumbs.push({
//       name: segment.charAt(0).toUpperCase() + segment.slice(1),
//       path: currentPath
//     });
//   });
//
//   return crumbs;
// });

</script>

<template>
<div class="drawer">
  <input id="my-drawer-2" type="checkbox" class="drawer-toggle" ref="drawerToggle" />

  <div class="drawer-content">
    <!-- Navbar -->
    <div class="navbar bg-base-300 sticky top-0 z-50">
      <div class="flex-none lg:hidden">
        <label for="my-drawer-2" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block h-6 w-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </div>
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">coinfo</a>
      </div>
      <!-- 테마 변경 콤보박스 -->
      <div class="flex-none">
        <!-- daisyUI Dropdown으로 교체 -->
        <div v-show="isDropdownVisible" class="dropdown dropdown-end">
          <div ref="themeDropdownButton" tabindex="0" role="button" class="btn btn-ghost normal-case">
            <Icon :name="`mdi:${themeIcons[themes.indexOf(currentTheme)]}`" size="1.75em" />
            <span class="hidden md:inline">{{ currentTheme }}</span>
            <svg width="12px" height="12px" class="ml-1 hidden h-3 w-3 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu menu-sm mt-3 max-h-96 w-56 overflow-y-auto rounded-box bg-base-200 p-2 shadow">
            <li v-for="(theme, index) in themes" :key="theme">
              <a @click="currentTheme = theme" :class="{ 'active': currentTheme === theme }">
                <Icon :name="`mdi:${themeIcons[index]}`" size="1.5em" /> {{ theme }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="drawer-side z-50">
    <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Sidebar content here -->
      <li class="menu-title">LNB Menu</li>
      <li><NuxtLink to="/" @click="closeDrawer">Home</NuxtLink></li>
      <li><NuxtLink to="/about" @click="closeDrawer">About</NuxtLink></li>
      <li><NuxtLink to="/websocket-test" @click="closeDrawer">websocket-test</NuxtLink></li>
    </ul>
  </div>
</div>
</template>

<style scoped>

</style>