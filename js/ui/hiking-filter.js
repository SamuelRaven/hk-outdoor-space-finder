/* ========================================
   Hiking Filter Page — 徒步筛选页
   状态机管理四个筛选器 + GO + 盲盒
   ======================================== */

import { navigate, register } from '../core/router.js';

// ---- 选项定义 ----
const REGIONS = ['港島', '九龍', '新界'];
const DIFFICULTIES = ['著波鞋就得', '著行山鞋穩陣D', '著咩鞋都腳軟'];
const SCENERIES = ['山海之間', '深山林蔭', '水庫平湖', '登頂大景', '瀑布溪澗', '歷史遺跡'];
const SURFACES = ['石屎路為主', '山徑為主', '樓梯為主', '混合'];

// ---- 状态 ----
let districtsData = {};
let state = {};
let filterGrid, optionsContainer;

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

  // 返回按钮
  section.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigate('#/');
  });

  // GO! 按钮
  section.querySelector('[data-action="go"]').addEventListener('click', () => {
    if (!state.region && !state.difficulty && !state.scenery && !state.surface) {
      import('./toast.js').then(m => {
        m.showToast('請至少選擇一個篩選條件～');
      });
      return;
    }
    window.__appState = window.__appState || {};
    window.__appState.hikingFilters = { ...state };
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
    resetAllFilterBtns();
    optionsContainer.innerHTML = '';
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
  switch (filterName) {
    case 'region':     showRegionOptions(); break;
    case 'difficulty': showDifficultyOptions(); break;
    case 'scenery':    showSceneryOptions(); break;
    case 'surface':    showSurfaceOptions(); break;
  }
}

// ---- 地区选项（与公园版相同：大区 → 小区级联） ----
function showRegionOptions() {
  optionsContainer.innerHTML = '';

  REGIONS.forEach(region => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (region === state.region) chip.classList.add('chip--selected');
    chip.textContent = region;
    chip.addEventListener('click', () => {
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

  if (state.region && districtsData[state.region]) {
    const divider = document.createElement('div');
    divider.className = 'filter-options__divider';
    optionsContainer.appendChild(divider);

    districtsData[state.region].forEach(district => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      if (district === state.district) chip.classList.add('chip--selected');
      chip.textContent = district;
      chip.addEventListener('click', () => {
        state.district = (district === state.district) ? null : district;
        updateDistrictDisplay();
        showRegionOptions();
      });
      optionsContainer.appendChild(chip);
    });
  }
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
  DIFFICULTIES.forEach(diff => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (diff === state.difficulty) chip.classList.add('chip--selected');
    chip.textContent = diff;
    chip.addEventListener('click', () => {
      state.difficulty = (diff === state.difficulty) ? null : diff;
      updateFilterBtn('difficulty', state.difficulty || '選擇');
      showDifficultyOptions();
    });
    optionsContainer.appendChild(chip);
  });
}

// ---- 氛围选项 ----
function showSceneryOptions() {
  optionsContainer.innerHTML = '';
  SCENERIES.forEach(sc => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (sc === state.scenery) chip.classList.add('chip--selected');
    chip.textContent = sc;
    chip.addEventListener('click', () => {
      state.scenery = (sc === state.scenery) ? null : sc;
      updateFilterBtn('scenery', state.scenery || '選擇');
      showSceneryOptions();
    });
    optionsContainer.appendChild(chip);
  });
}

// ---- 路况选项 ----
function showSurfaceOptions() {
  optionsContainer.innerHTML = '';
  SURFACES.forEach(sf => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (sf === state.surface) chip.classList.add('chip--selected');
    chip.textContent = sf;
    chip.addEventListener('click', () => {
      state.surface = (sf === state.surface) ? null : sf;
      updateFilterBtn('surface', state.surface || '選擇');
      showSurfaceOptions();
    });
    optionsContainer.appendChild(chip);
  });
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
