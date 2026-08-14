/* ========================================
   Hiking Filter Page — 徒步筛选页
   状态机管理四个筛选器 + GO + 盲盒
   ======================================== */

import { navigate, register } from '../core/router.js?v=4';
import { matchTrails } from '../core/trail-matcher.js?v=4';

// ---- 选项定义 ----
const REGIONS = ['港島', '九龍', '新界'];
const DIFFICULTIES = ['著波鞋就得', '著波鞋都頂得住', '著行山鞋穩陣D', '著行山鞋都腳軟', '著咩鞋都打嗮震'];
const SCENERIES = ['山海之間', '深山林蔭', '水庫平湖', '登頂大景', '瀑布溪澗', '歷史遺跡', '奇岩怪石'];
const SURFACES = ['石屎路為主', '山徑為主', '樓梯為主', '混合'];

// ---- 选中底色：难度/地区/氛围/路况固定映射，小区按序循环（紫橙绿红黄蓝青绿） ----
const DIFFICULTY_COLORS = { '著波鞋就得': 'yellow', '著波鞋都頂得住': 'blue', '著行山鞋穩陣D': 'purple', '著行山鞋都腳軟': 'red', '著咩鞋都打嗮震': 'black' };
const REGION_COLORS = { '港島': 'blue', '九龍': 'red', '新界': 'yellow' };
const SCENERY_COLORS = { '山海之間': 'blue', '深山林蔭': 'green', '水庫平湖': 'orange', '登頂大景': 'yellow', '瀑布溪澗': 'teal', '歷史遺跡': 'purple', '奇岩怪石': 'black' };
const DISTRICT_COLORS = ['purple', 'orange', 'green', 'red', 'yellow', 'blue', 'teal'];
const SURFACE_COLORS = { '石屎路為主': 'yellow', '山徑為主': 'blue', '樓梯為主': 'purple', '混合': 'red' };

// ---- 状态 ----
let districtsData = {};
let trails = [];
let state = {};
let filterGrid, optionsContainer;
let activePanel = null;

// ---- 创建初始状态 ----
function createInitialState() {
  return {
    region: null,
    district: null,
    difficulty: null,
    scenery: null,
    surface: null,
  };
}

// ---- 初始化 ----
function init() {
  const section = document.getElementById('page-hiking-filter');
  filterGrid = document.getElementById('hiking-filter-grid');
  optionsContainer = document.getElementById('hiking-filter-options');

  // 重置状态
  state = createInitialState();
  resetAllFilterBtns();
  optionsContainer.innerHTML = '';

  // 加载地区数据（如果还没加载）
  if (Object.keys(districtsData).length === 0) {
    fetch('js/data/districts.json')
      .then(r => r.json())
      .then(data => { districtsData = data; })
      .catch(err => console.error('加载 districts.json 失败:', err));
  }

  // 加载山径数据（用于交叉筛选兼容性检查）
  if (trails.length === 0) {
    fetch('js/data/trails.json?v=5')
      .then(r => r.json())
      .then(data => {
        trails = data;
        if (activePanel && optionsContainer.children.length > 0) {
          handleFilterTap(activePanel);
        }
        updateFilterBtnStates();
      })
      .catch(err => console.error('加载 trails.json 失败:', err));
  }

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/');
  });

  // GO! 按钮
  section.querySelector('[data-action="go"]').addEventListener('click', () => {
    if (!state.region && !state.difficulty && !state.scenery && !state.surface) {
      import('./toast.js').then(m => {
        m.showToast('請至少選擇一個篩選條件');
      });
      return;
    }
    if (trails.length > 0 && matchTrails(trails, state).length === 0) {
      import('./toast.js').then(m => {
        m.showToast('沒有符合條件的山徑<br>試試調整篩選條件吧');
      });
      return;
    }
    window.__appState = window.__appState || {};
    window.__appState.hikingFilters = { ...state };
    sessionStorage.setItem('trailFilters', JSON.stringify(state));
    navigate('#/hiking-results');
  });

  // 盲盒按钮
  section.querySelector('[data-action="hiking-blindbox"]').addEventListener('click', () => {
    navigate('#/hiking-blindbox');
  });

  // 收藏按钮
  section.querySelector('[data-action="fav-trails"]').addEventListener('click', () => {
    navigate('#/fav-trails');
  });

  // Reset! 按钮
  section.querySelector('[data-action="reset"]').addEventListener('click', () => {
    state = createInitialState();
    activePanel = null;
    resetAllFilterBtns();
    optionsContainer.innerHTML = '';
    updateFilterBtnStates();
  });

  // 筛选按钮点击
  filterGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn || btn.disabled) return;
    handleFilterTap(btn.dataset.filter);
  });
}

function destroy() {
  // 离开时不清空，由 init 负责重置
}

// ---- 筛选器分发 ----
function handleFilterTap(filterName) {
  activePanel = filterName;
  switch (filterName) {
    case 'region':     showRegionOptions(); break;
    case 'difficulty': showDifficultyOptions(); break;
    case 'scenery':    showSceneryOptions(); break;
    case 'surface':    showSurfaceOptions(); break;
  }
}

// ---- 交叉筛选兼容性 ----
function getIncompatibleOptions(groupKey) {
  const incompatible = new Set();
  if (trails.length === 0) return incompatible;

  const optionLists = { region: REGIONS, difficulty: DIFFICULTIES, scenery: SCENERIES, surface: SURFACES };
  const options = optionLists[groupKey];
  if (!options) return incompatible;

  const otherKeys = Object.keys(optionLists).filter(k => k !== groupKey);
  const hasOtherSelections = otherKeys.some(k => state[k]);
  if (!hasOtherSelections) return incompatible;

  for (const option of options) {
    if (option === state[groupKey]) continue;
    const testState = { ...state, [groupKey]: option };
    if (groupKey === 'region') testState.district = null;
    if (matchTrails(trails, testState).length === 0) incompatible.add(option);
  }
  return incompatible;
}

// ---- 更新顶部筛选按钮 disabled 状态 ----
function updateFilterBtnStates() {
  const dims = ['region', 'difficulty', 'scenery', 'surface'];
  const optionLists = { region: REGIONS, difficulty: DIFFICULTIES, scenery: SCENERIES, surface: SURFACES };
  if (trails.length === 0) return;
  dims.forEach(k => {
    const incompatible = getIncompatibleOptions(k);
    const btn = filterGrid.querySelector(`[data-filter="${k}"]`);
    if (btn) btn.disabled = (incompatible.size === optionLists[k].length);
  });
}

// ---- 地区选项（与公园版相同：大区 → 小区级联） ----
function showRegionOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('region');

  REGIONS.forEach((region, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (region === state.region) chip.classList.add('chip--selected', 'chip--c-' + REGION_COLORS[region]);
    if (incompatible.has(region)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = region;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      if (region === state.region) {
        state.region = null;
        state.district = null;
        updateFilterBtn('region', '選擇');
      } else {
        state.region = region;
        state.district = null;
        updateFilterBtn('region', region);
      }
      showRegionOptions();
    });
    optionsContainer.appendChild(chip);
  });

  if (state.region && districtsData[state.region] && districtsData[state.region].length > 0) {
    const divider = document.createElement('div');
    divider.className = 'filter-options__divider';
    optionsContainer.appendChild(divider);

    districtsData[state.region].forEach((district, i) => {
      let districtIncompatible = false;
      if (trails.length > 0) {
        const otherKeys = ['difficulty', 'scenery', 'surface'];
        const hasOther = otherKeys.some(k => state[k]);
        if (hasOther) {
          const testState = { ...state, district: district };
          if (matchTrails(trails, testState).length === 0) districtIncompatible = true;
        }
      }

      const chip = document.createElement('button');
      chip.className = 'chip';
      if (district === state.district) chip.classList.add('chip--selected', 'chip--c-' + DISTRICT_COLORS[i % DISTRICT_COLORS.length]);
      if (districtIncompatible && district !== state.district) { chip.disabled = true; chip.classList.add('chip--disabled'); }
      chip.textContent = district;
      chip.addEventListener('click', () => {
        if (chip.disabled) return;
        state.district = (district === state.district) ? null : district;
        updateDistrictDisplay();
        showRegionOptions();
      });
      optionsContainer.appendChild(chip);
    });
  }
  updateFilterBtnStates();
}

function updateDistrictDisplay() {
  const label = state.district
    ? `${state.region} — ${state.district}`
    : (state.region || '選擇');
  updateFilterBtn('region', label);
}

// ---- 难度选项 ----
function showDifficultyOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('difficulty');
  DIFFICULTIES.forEach(diff => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (diff === state.difficulty) chip.classList.add('chip--selected', 'chip--c-' + DIFFICULTY_COLORS[diff]);
    if (incompatible.has(diff)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = diff;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.difficulty = (diff === state.difficulty) ? null : diff;
      updateFilterBtn('difficulty', state.difficulty || '選擇');
      showDifficultyOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
}

// ---- 氛围选项 ----
function showSceneryOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('scenery');
  SCENERIES.forEach((sc, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (sc === state.scenery) chip.classList.add('chip--selected', 'chip--c-' + SCENERY_COLORS[sc]);
    if (incompatible.has(sc)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = sc;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.scenery = (sc === state.scenery) ? null : sc;
      updateFilterBtn('scenery', state.scenery || '選擇');
      showSceneryOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
}

// ---- 路况选项 ----
function showSurfaceOptions() {
  optionsContainer.innerHTML = '';
  const incompatible = getIncompatibleOptions('surface');
  SURFACES.forEach(sf => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (sf === state.surface) chip.classList.add('chip--selected', 'chip--c-' + SURFACE_COLORS[sf]);
    if (incompatible.has(sf)) { chip.disabled = true; chip.classList.add('chip--disabled'); }
    chip.textContent = sf;
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      state.surface = (sf === state.surface) ? null : sf;
      updateFilterBtn('surface', state.surface || '選擇');
      showSurfaceOptions();
    });
    optionsContainer.appendChild(chip);
  });
  updateFilterBtnStates();
}

// ---- 更新筛选按钮文字 ----
function updateFilterBtn(filterName, displayValue) {
  const btn = filterGrid.querySelector(`[data-filter="${filterName}"]`);
  if (btn) {
    btn.querySelector('.filter-btn__value').textContent = displayValue;
    btn.dataset.selected = displayValue !== '選擇' ? 'true' : '';
  }
}

// ---- 重置所有筛选按钮 ----
function resetAllFilterBtns() {
  updateFilterBtn('region', '選擇');
  updateFilterBtn('difficulty', '選擇');
  updateFilterBtn('scenery', '選擇');
  updateFilterBtn('surface', '選擇');
}

// ---- 注册路由 ----
register('page-hiking-filter', init, destroy);
