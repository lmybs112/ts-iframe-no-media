/**
 * 智慧選物彈窗 Web Component
 * 
 * 使用方式：
 * <inf-marketing-modal id="myModal" width="480" height="480">
 *   <div slot="content">彈窗內容</div>
 * </inf-marketing-modal>
 * 
 * 或透過 JavaScript：
 * const modal = document.querySelector('#myModal');
 * 
 * // 設置 iframe 配置（可選）
 * modal.setIframeConfig({
 *   id: '2025-05-29-18-00-13-2',
 *   brand: 'ALMI',
 *   MRID: 'mrid-value',
 *   GVID: 'gvid-value',
 *   LGVID: 'lgvid-value'
 * });
 * 
 * // 或分別設置
 * modal.setIframeId('custom-id-123');
 * modal.setIframeBrand('MyBrand');
 * modal.setIframeMRID('mrid-value');
 * modal.setIframeGVID('gvid-value');
 * modal.setIframeLGVID('lgvid-value');
 * 
 * // 顯示帶 iframe 的彈窗
 * modal.setIframeUrl('https://example.com');
 * modal.show();
 * 
 * // 或直接顯示並設置 iframe
 * modal.show('https://example.com');
 */

const componentName = 'inf-marketing-modal';

const PARENT_UI_DEFAULT_LANG = 'zh-TW';

const PARENT_UI_MESSAGES = {
  'zh-TW': {
    'common.close': '關閉',
    'common.dontShowToday': '今日不再顯示',
    'banner.defaultTitle': '精選購物之旅',
    'banner.defaultDescription': '找到您的個人化專屬商品',
    'banner.defaultCta': '立即開始',
    'card.navPrev': '上一張',
    'card.navNext': '下一張',
    'card.smartSelection': '智慧選物',
    'card.officialPromo': '官網特惠',
    'modal.loadingTitle': '智慧選物',
    'modal.loadingText': '正在載入智慧選物介面...',
    'modal.loadingHint': '提示：如果看到此訊息，表示彈窗功能正常，但尚未設置 iframe URL。',
    'modal.loadingMissingUrl': '請聯繫管理員設置智慧選物頁面 URL',
    'float.tooltip': '來試試 infFITS 個人化推薦購物！',
    'float.openSmartSelection': '開啟智慧選物',
    'float.openSmartSelectionWith': '開啟智慧選物：{text}',
    'float.closeSmartSelection': '關閉智慧選物',
    'float.viewResults': '查看搜尋結果',
    'float.closeTooltip': '關閉提示',
    'float.guideTapHere': '點這裡開啟智慧選物',
    'float.guideSkip': '略過',
    'float.guideStart': '開始',
    'float.guideReplay': '再看一次教學',
    'float.multiRouteReopen': '重新選擇動線',
    'float.multiRouteSectionLabel': '選擇動線',
    'float.multiRouteGuideHint': '點選上方動線開始，或點下方搜尋鈕直接體驗 AI 推薦',
    'float.multiRouteGuideSkip': '略過教學',
    'float.aiRouteLabel': 'AI 推薦動線'
  },
  en: {
  'common.close': 'Close',

  'common.dontShowToday': "Don't show again today",

  'banner.defaultTitle': 'Your Curated Shopping Journey',

  'banner.defaultDescription': 'Discover products selected just for you',

  'banner.defaultCta': 'Start Exploring',

  'card.navPrev': 'Previous',

  'card.navNext': 'Next',

  'card.smartSelection': 'Smart Selection',

  'card.officialPromo': 'Official Offers',

  'modal.loadingTitle': 'Smart Selection',

  'modal.loadingText': 'Loading Smart Selection…',

  'modal.loadingHint': 'Tip: The modal is working, but no iframe URL has been configured yet.',

  'modal.loadingMissingUrl': 'Please contact your administrator to configure the Smart Selection page URL',

  'float.tooltip': 'Discover Your Personalized Picks with infFITS',

  'float.openSmartSelection': 'Open Smart Selection',

  'float.openSmartSelectionWith': 'Open Smart Selection: {text}',

  'float.closeSmartSelection': 'Close Smart Selection',

  'float.viewResults': 'View Results',

  'float.closeTooltip': 'Close Tooltip',

  'float.guideTapHere': 'Tap here to open Smart Selection',

  'float.guideSkip': 'Skip',

  'float.guideStart': 'Get Started',

  'float.guideReplay': 'Replay Tutorial',

  'float.multiRouteReopen': 'Choose a Route Again',

  'float.multiRouteSectionLabel': 'Choose a Route',

  'float.multiRouteGuideHint': 'Choose a route above, or tap the search button below to get AI-powered recommendations',

  'float.multiRouteGuideSkip': 'Skip Tutorial',

  'float.aiRouteLabel': 'AI-Recommended Route'

  }
};

/** @deprecated 請改用 parentUiT；保留供外部參考 */
const FLOATING_TOOLTIP_TEXT = PARENT_UI_MESSAGES['zh-TW']['float.tooltip'];

function getParentUiLang(lang) {
  if (lang == null || String(lang).trim() === '') return PARENT_UI_DEFAULT_LANG;
  var s = String(lang).trim().toLowerCase();
  if (s === 'en' || s.indexOf('en-') === 0) return 'en';
  if (s === 'zh-tw' || s === 'zh-hant' || s === 'zh' || s.indexOf('zh-') === 0) return 'zh-TW';
  return PARENT_UI_DEFAULT_LANG;
}

function parentUiT(lang, key, replacements) {
  var normalizedLang = getParentUiLang(lang);
  var table = PARENT_UI_MESSAGES[normalizedLang] || PARENT_UI_MESSAGES[PARENT_UI_DEFAULT_LANG] || {};
  var fallback = PARENT_UI_MESSAGES[PARENT_UI_DEFAULT_LANG] || {};
  var msg = Object.prototype.hasOwnProperty.call(table, key) ? table[key]
    : (Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : key);
  if (replacements && typeof replacements === 'object') {
    Object.keys(replacements).forEach(function (placeholder) {
      msg = msg.split('{' + placeholder + '}').join(String(replacements[placeholder]));
    });
  }
  return msg;
}

function escapeHtmlForTooltip(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getModalFallbackContentHtml(lang) {
  var l = getParentUiLang(lang);
  var title = escapeHtmlForTooltip(parentUiT(l, 'modal.loadingTitle'));
  var loading = escapeHtmlForTooltip(parentUiT(l, 'modal.loadingText'));
  var hint = escapeHtmlForTooltip(parentUiT(l, 'modal.loadingHint'));
  var missingUrl = escapeHtmlForTooltip(parentUiT(l, 'modal.loadingMissingUrl'));
  return `
                <div slot="content">
                    <div style="padding: 40px; text-align: center; color: #333;">
                        <h2 style="margin: 0 0 20px 0; color: #667eea;">🎯 ${title}</h2>
                        <p style="margin: 0 0 15px 0; line-height: 1.6;">${loading}</p>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #6c757d;">
                                💡 ${hint}
                            </p>
                        </div>
                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #aaa;">
                            ${missingUrl}
                        </p>
                    </div>
                </div>
            `;
}

function isSmartSelectionCardItem(item) {
  if (!item) return false;
  if (item.isSmartSelection === true) return true;
  var zhTitle = parentUiT('zh-TW', 'card.smartSelection');
  var enTitle = parentUiT('en', 'card.smartSelection');
  return item.Title === zhTitle || item.Title === enTitle || item.Title === '智慧選物';
}

// 創建 HTML 模板
const template = document.createElement('template');
template.innerHTML = /*html*/`
    <style>
        :host {
            --modal-width: 480px;
            --modal-height: 480px;
            --modal-background: transparent;
            --modal-border-radius: 28px;
            --modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            --overlay-background: rgba(0, 0, 0, 0.7);
            --close-button-size: 36px;
            --close-button-background: rgba(0, 0, 0, 0.6);
            --close-button-hover-background: rgba(255, 255, 255, 0.9);
            
            /* 修復定位問題：移除 contain 屬性，使用強制定位 */
            display: block;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            pointer-events: none;
            z-index: 2000000000 !important;
        }

        .modal-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: auto;
        }

        .modal-container.show {
            opacity: 1;
            visibility: visible;
        }
        
        /* 對話框模式：讓點擊事件穿透到下面的元素 */
        .modal-container.dialog-mode {
            pointer-events: none !important;
        }
        
        .modal-container.dialog-mode .modal-wrapper {
            pointer-events: none !important;
        }
        
        .modal-container.dialog-mode .modal-content {
            pointer-events: auto !important;
        }
        
        .modal-container.dialog-mode .modal-overlay {
            pointer-events: none !important;
        }
        
        /* 對話框模式下的 :host 元素 */
        :host(.dialog-mode) {
            pointer-events: none !important;
        }
        
        /* 強制對話框模式下的所有元素都不攔截點擊事件，除了 modal-content */
        .modal-container.dialog-mode * {
            pointer-events: none !important;
        }
        
        .modal-container.dialog-mode .modal-content,
        .modal-container.dialog-mode .modal-content * {
            pointer-events: auto !important;
        }

        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--overlay-background);
            backdrop-filter: blur(5px);
            cursor: pointer;
        }

        .modal-wrapper {
            position: relative;
            display: inline-block;
        }

        .modal-content {
            position: relative;
            background: var(--modal-background);
            border-radius: var(--modal-border-radius);
            padding: 0;
            width: var(--modal-width);
            height: var(--modal-height);
            overflow: hidden;
            transform: scale(0.7) translateY(50px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: var(--modal-shadow);
        }

        .modal-container.show .modal-content {
            transform: scale(1) translateY(0);
        }

        .modal-close-btn {
            position: absolute;
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--close-button-background);
            border: none;
            font-size: 20px;
            color: #fff;
            cursor: pointer;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            max-width: 36px;
            max-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 15;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .modal-close-btn svg {
            width: 60%;
            height: 60%;
            display: block;
            margin: auto;
        }

        .modal-close-btn:hover {
            background: var(--close-button-hover-background);
            color: #333;
            border-color: rgba(255, 255, 255, 0.4);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
        }

        .modal-body {
            width: 100%;
            height: 100%;
            position: relative;
        }

        .iframe-container {
            width: 100%;
            height: 100%;
            border-radius: var(--modal-border-radius);
            overflow: hidden;
        }

        .iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: var(--modal-border-radius);
        }

        .content-slot {
            width: 100%;
            height: 100%;
            overflow: auto;
            padding: 20px;
            box-sizing: border-box;
        }

        /* 響應式設計 */
        @media (max-width: 480px) {
            :host {
                --modal-width: 365px;
                --modal-height: 365px;
                --close-button-size: 32px;
            }
            
            .modal-close-btn {
                bottom: -40px;
                font-size: 18px;
            }
        }

        @media (max-width: 360px) {
            :host {
                --modal-width: 320px;
                --modal-height: 320px;
                --close-button-size: 28px;
            }
            
            .modal-content {
                margin: 20px;
            }
            
            .modal-close-btn {
                bottom: -35px;
                font-size: 16px;
            }
        }
        /* 新增：手機版動態視窗高度，確保上下置中 */
        @media (max-width: 480px) {
            .modal-container {
                min-height: 100dvh !important;
                height: 100dvh !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .modal-content {
                margin: 0 auto;
            }
            .modal-close-btn {
                bottom: -40px;
            }
        }
        /* 最兼容舊機型的 close-btn 樣式強化 */
        .modal-close-btn {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
          max-width: 36px !important;
          max-height: 36px !important;
          border-radius: 50% !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          margin: 0 !important;
          /* 保留原本的 background，不覆蓋 */
          /* background: inherit; */
          border: none !important;
          overflow: hidden !important;
          line-height: 1 !important;
          font-size: 20px !important;
          position: absolute;
          z-index: 15;
        }
        .modal-close-btn svg {
          width: 60% !important;
          height: 60% !important;
          display: block !important;
          margin: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          max-width: 100% !important;
          max-height: 100% !important;
          pointer-events: none;
        }
        @media (max-width: 480px) {
          .modal-close-btn {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            min-height: 28px !important;
            max-width: 28px !important;
            max-height: 28px !important;
            font-size: 16px !important;
          }
          .modal-close-btn svg {
            width: 60% !important;
            height: 60% !important;
            }
        }
    </style>
    
    <div class="modal-container" id="modal-container">
        <div class="modal-overlay" id="modal-overlay"></div>
        <div class="modal-wrapper">
            <div class="modal-content" id="modal-content">
                <div class="modal-body" id="modal-body">
                    <!-- iframe 容器，預設隱藏 -->
                    <div class="iframe-container" id="iframe-container" style="display: none;">
                        <!-- iframe 會在這裡動態創建 -->
                    </div>
                    <!-- slot 內容容器 -->
                    <div class="content-slot" id="content-slot">
                        <slot name="content"></slot>
                    </div>
                </div>
            </div>
            <!-- 關閉按鈕相對於彈窗定位 -->
            <button class="modal-close-btn" type="button" title="關閉" id="close-btn">×</button>
        </div>
    </div>
`;

/**
 * 智慧選物彈窗組件類別
 * @extends HTMLElement
 */
class InfMarketingModalComponent extends HTMLElement {
    constructor() {
        super();
        
        // 附加 shadow DOM
        this.attachShadow({ mode: 'open', delegatesFocus: true })
            .append(template.content.cloneNode(true));

        // jQuery 風格的選擇器
        this.$ = this.shadowRoot.querySelector.bind(this.shadowRoot);
        this.$$ = this.shadowRoot.querySelectorAll.bind(this.shadowRoot);

        // 內部狀態
        this.isVisible = false;
        this.currentIframeUrl = null;
        
        // iframe 配置參數
        this.iframeConfig = {
            id: '',
            brand: '',
            header: 'from_preview',
            MRID: '',
            GVID: '',
            LGVID: '',
            show_origin_price: false,
            use_route_linked_tags: false,
            intro_mode: null,
            enable_guide: false,
            lang: null
        };

        // 派發構造完成事件
        this.dispatchEvent(new Event(`${componentName}:construction`, { bubbles: true, composed: true }));
    }

    static get observedAttributes() {
        return ['width', 'height', 'overlay-color', 'border-radius', 'ui-lang'];
    }

    _getUiLang() {
        return getParentUiLang(this.getAttribute('ui-lang'));
    }

    _t(key, replacements) {
        return parentUiT(this._getUiLang(), key, replacements);
    }

    _syncStaticUiStrings() {
        const closeBtn = this.$('#close-btn');
        if (closeBtn) closeBtn.title = this._t('common.close');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'ui-lang') {
            this._syncStaticUiStrings();
            return;
        }

        const modalContent = this.$('#modal-content');
        if (!modalContent) return;

        switch (name) {
            case 'width':
                modalContent.style.setProperty('--modal-width', newValue || '480px');
                break;
            case 'height':
                modalContent.style.setProperty('--modal-height', newValue || '480px');
                break;
            case 'overlay-color':
                const overlay = this.$('#modal-overlay');
                if (overlay) {
                    overlay.style.background = newValue || 'rgba(0, 0, 0, 0.7)';
                }
                break;
            case 'border-radius':
                modalContent.style.setProperty('--modal-border-radius', newValue || '16px');
                break;
        }
    }

    connectedCallback() {
        this.bindEvents();
        this._syncStaticUiStrings();
        
        // 派發連接完成事件
        this.dispatchEvent(new Event(`${componentName}:connected`, { bubbles: true, composed: true }));
    }

    disconnectedCallback() {
        // 清理資源
        this.hide();
        
        // 派發斷開連接事件
        this.dispatchEvent(new Event(`${componentName}:disconnected`, { bubbles: true, composed: true }));
    }

    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        const closeBtn = this.$('#close-btn');
        const overlay = this.$('#modal-overlay');

        if (closeBtn) {
            const handleCloseClick = (e) => {
                e.stopPropagation();
                this.hide();
            };
            
            closeBtn.addEventListener('click', handleCloseClick);
            closeBtn.addEventListener('touchend', handleCloseClick, { passive: false });
        }

        if (overlay) {
            const handleOverlayClick = (e) => {
                // 檢查是否為對話框模式（平板以上且不鎖定背景滾動）
                const isTabletOrLarger = window.innerWidth >= 768;
                const isDialogMode = isTabletOrLarger && this._isDialogMode;
                
                // 如果是對話框模式，背景點擊不關閉彈窗
                if (isDialogMode) {
                    return;
                }
                
                if (e.target === overlay) {
                    this.hide();
                }
            };
            
            overlay.addEventListener('click', handleOverlayClick);
            overlay.addEventListener('touchend', handleOverlayClick, { passive: false });
        }

        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Escape') {
                this.hide();
            }
        });
    }

    /**
     * 顯示彈窗
     * @param {string} iframeUrl - 可選的 iframe URL
     */
    show(iframeUrl = null, options = {}) {
        const modalContainer = this.$('#modal-container');
        if (!modalContainer) return;

        // 如果提供了 iframe URL，設置 iframe
        if (iframeUrl) {
            this.setIframeUrl(iframeUrl);
        }

        // 修復定位問題：啟用 :host 的 pointer-events
        this.style.pointerEvents = 'auto';
        
        // 顯示彈窗
        modalContainer.classList.add('show');
        this.isVisible = true;
        
        // 根據選項決定是否防止背景滾動
        // 預設為 true（保持向後兼容），但可以通過 options.preventScroll 控制
        const preventScroll = options.preventScroll !== undefined ? options.preventScroll : true;
        if (preventScroll) {
            document.body.style.overflow = 'hidden';
        }
        
        // 設置對話框模式標記（平板以上且不鎖定背景滾動）
        const isTabletOrLarger = window.innerWidth >= 768;
        this._isDialogMode = isTabletOrLarger && !preventScroll;
        
        // 如果是對話框模式，設置 pointer-events
        if (this._isDialogMode) {
            const modalContainer = this.$('#modal-container');
            if (modalContainer) {
                modalContainer.classList.add('dialog-mode');
            }
            this.classList.add('dialog-mode');
        }

        // 派發顯示事件
        this.dispatchEvent(new CustomEvent(`${componentName}:show`, {
            bubbles: true,
            composed: true,
            detail: { iframeUrl: this.currentIframeUrl, preventScroll }
        }));
    }

    /**
     * 隱藏彈窗
     */
    hide() {
        const modalContainer = this.$('#modal-container');
        if (!modalContainer) return;

        // 關閉前通知 iframe（讓其清理／重置狀態）
        this.notifyIframeParentClose();

        modalContainer.classList.remove('show');
        this.isVisible = false;
        
        // 修復定位問題：禁用 :host 的 pointer-events
        this.style.pointerEvents = 'none';
        
        // 恢復背景滾動（只有在之前被鎖定的情況下才恢復）
        if (document.body.style.overflow === 'hidden') {
            document.body.style.overflow = '';
        }
        
        // 移除對話框模式類別
        const modalContainerElement = this.$('#modal-container');
        if (modalContainerElement) {
            modalContainerElement.classList.remove('dialog-mode');
        }
        this.classList.remove('dialog-mode');

        // 只隱藏 iframe 容器，不清空內容（保留以便重複使用）
        const iframeContainer = this.$('#iframe-container');
        if (iframeContainer) {
            iframeContainer.style.display = 'none';
        }

        // 派發隱藏事件
        this.dispatchEvent(new CustomEvent(`${componentName}:hide`, {
            bubbles: true,
            composed: true,
            detail: { iframeUrl: this.currentIframeUrl }
        }));
    }

    /**
     * 通知 iframe：父頁即將關閉彈窗／遮罩
     */
    notifyIframeParentClose() {
        try {
            const iframeElement = this.$('#iframe-container iframe')
                || this.$('#iframe-container-content');
            if (iframeElement && iframeElement.contentWindow) {
                iframeElement.contentWindow.postMessage(
                    { header: 'parent_close_modal' },
                    '*'
                );
            }
        } catch (error) {
            console.warn('無法向 iframe 發送 parent_close_modal:', error);
        }
    }

    /**
     * 設置 iframe URL
     * @param {string} url - iframe 的 URL
     */
    setIframeUrl(url) {
        if (!url) return;

        const iframeContainer = this.$('#iframe-container');
        const contentSlot = this.$('#content-slot');
        
        if (!iframeContainer || !contentSlot) return;

        // 檢查是否已經有相同的 URL 的 iframe
        const existingIframe = iframeContainer.querySelector('iframe');
        if (existingIframe && existingIframe.src === url && this.currentIframeUrl === url) {
            // 同 URL 重用：保留 iframe 記憶體狀態，不重送 from_preview
            // （跨頁會新建 iframe，由 onload → sendIframeMessage 帶 selection_restore）
            iframeContainer.style.display = 'block';
            contentSlot.style.display = 'none';
            
            // 派發 iframe 設置事件（重用現有 iframe，無需重新發送訊息）
            this.dispatchEvent(new CustomEvent(`${componentName}:iframe-set`, {
                bubbles: true,
                composed: true,
                detail: { url, reused: true }
            }));
            
                return;
            }

        // 清空容器並創建新的 iframe
        iframeContainer.innerHTML = '';
        
        const iframeElement = document.createElement('iframe');
        iframeElement.src = url;
        iframeElement.id = 'iframe-container-content';
        iframeElement.frameBorder = '0';
        iframeElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; identity-credentials-get';
        iframeElement.allowFullscreen = true;
        iframeElement.setAttribute('permissionspolicy', 'identity-credentials-get=(self)');
        
        // 添加 onload 事件處理器
        iframeElement.onload = () => {
            this.sendIframeMessage(iframeElement);
            
            // 派發 iframe 載入完成事件
            this.dispatchEvent(new CustomEvent(`${componentName}:iframe-loaded`, {
                bubbles: true,
                composed: true,
                detail: {
                    url: url,
                    config: this.iframeConfig
                }
            }));
        };

        // 添加 onerror 事件處理器
        iframeElement.onerror = () => {
            // 派發 iframe 載入失敗事件
            this.dispatchEvent(new CustomEvent(`${componentName}:iframe-error`, {
                bubbles: true,
                composed: true,
                detail: { 
                    url: url,
                    config: this.iframeConfig
                }
            }));
        };
        
        // 將 iframe 添加到容器
        iframeContainer.appendChild(iframeElement);

        // 顯示 iframe 容器，隱藏 slot 內容
        iframeContainer.style.display = 'block';
        contentSlot.style.display = 'none';

        this.currentIframeUrl = url;

        // 派發 iframe 設置事件
        this.dispatchEvent(new CustomEvent(`${componentName}:iframe-set`, {
            bubbles: true,
            composed: true,
            detail: { url, reused: false }
        }));
    }

    /**
     * 向 iframe 發送配置訊息
     * @param {HTMLIFrameElement} iframeElement - iframe 元素
     */
    sendIframeMessage(iframeElement) {
        const iframe_container = iframeElement.contentWindow;
        const iframe_preview_obj = {
            id: this.iframeConfig.id,
            header: this.iframeConfig.header,
            brand: this.iframeConfig.brand,
            MRID: this.iframeConfig.MRID,
            GVID: this.iframeConfig.GVID,
            LGVID: this.iframeConfig.LGVID,
            show_origin_price: this.iframeConfig.show_origin_price === true,
            use_route_linked_tags: this.iframeConfig.use_route_linked_tags === true,
            intro_mode: (this.iframeConfig.intro_mode === 'v1' || this.iframeConfig.intro_mode === 'v2')
                ? this.iframeConfig.intro_mode
                : null,
            enable_guide: this.iframeConfig.enable_guide === true
        };
        if (this.iframeConfig.lang) {
            iframe_preview_obj.lang = this.iframeConfig.lang;
        }
        if (typeof InfSelectionProgress !== 'undefined' && InfSelectionProgress.attachRestore) {
            InfSelectionProgress.attachRestore(iframe_preview_obj);
        }

        try {
            iframe_container.postMessage(iframe_preview_obj, "*");
        } catch (error) {
            console.warn('無法向 iframe 發送訊息:', error);
        }
    }

    /**
     * 清空 iframe 內容
     * 注意：此方法會完全清空 iframe，建議只在需要強制重新載入時使用
     * 一般情況下，hide() 方法只會隱藏 iframe，保留內容以便重複使用
     */
    clearIframe() {
        const iframeContainer = this.$('#iframe-container');
        const contentSlot = this.$('#content-slot');
        
        if (!iframeContainer || !contentSlot) return;

        // 清空 iframe
        iframeContainer.innerHTML = '';
        iframeContainer.style.display = 'none';
        
        // 顯示 slot 內容
        contentSlot.style.display = 'block';

        this.currentIframeUrl = null;
        
        // 派發 iframe 清空事件
        this.dispatchEvent(new CustomEvent(`${componentName}:iframe-cleared`, {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * 設置 iframe 配置參數
     * @param {Object} config - 配置對象
     * @param {string} config.id - iframe 訊息 ID
     * @param {string} config.brand - 品牌名稱
     * @param {string} config.header - 訊息標頭（默認為 'from_preview'）
     * @param {string} config.MRID - MRID 參數（可選）
     * @param {string} config.GVID - GVID 參數（可選）
     * @param {string} config.LGVID - LGVID 參數（可選）
     * @param {boolean} [config.show_origin_price=false] - 是否顯示原價（可選，預設 false）
     * @param {boolean} [config.use_route_linked_tags=false] - 是否開啟 RouteLinkedTags 過濾（可選，預設 false）
     * @param {null|'v1'|'v2'} [config.intro_mode=null] - 介紹模式（可選，預設 null）
     * @param {boolean} [config.enable_guide=false] - 是否啟用遮罩引導（可選，預設 false）
     * @param {'zh-TW'|'en'} [config.lang] - iframe UI 語系（可選；省略則 iframe 預設 zh-TW）
     */
    setIframeConfig(config) {
        if (typeof config === 'object' && config !== null) {
            this.iframeConfig = {
                ...this.iframeConfig,
                ...config
            };
            if (Object.prototype.hasOwnProperty.call(config, 'intro_mode')) {
                this.iframeConfig.intro_mode = (config.intro_mode === 'v1' || config.intro_mode === 'v2')
                    ? config.intro_mode
                    : null;
            }
            if (Object.prototype.hasOwnProperty.call(config, 'enable_guide')) {
                this.iframeConfig.enable_guide = config.enable_guide === true;
            }
            if (Object.prototype.hasOwnProperty.call(config, 'lang')) {
                this.iframeConfig.lang = normalizeIframeLang(config.lang);
            }
        }
    }

    /**
     * 獲取當前 iframe 配置
     * @returns {Object} 當前配置對象
     */
    getIframeConfig() {
        return { ...this.iframeConfig };
    }

    /**
     * 設置 iframe ID
     * @param {string} id - iframe 訊息 ID
     */
    setIframeId(id) {
        if (typeof id === 'string' && id.trim()) {
            this.iframeConfig.id = id.trim();
        }
    }

    /**
     * 設置品牌名稱
     * @param {string} brand - 品牌名稱
     */
    setIframeBrand(brand) {
        if (typeof brand === 'string' && brand.trim()) {
            this.iframeConfig.brand = brand.trim();
        }
    }

    /**
     * 設置 MRID 參數
     * @param {string} mrid - MRID 值
     */
    setIframeMRID(mrid) {
        if (typeof mrid === 'string' && mrid.trim()) {
            this.iframeConfig.MRID = mrid.trim();
        }
    }

    /**
     * 設置 GVID 參數
     * @param {string} gvid - GVID 值
     */
    setIframeGVID(gvid) {
        if (typeof gvid === 'string' && gvid.trim()) {
            this.iframeConfig.GVID = gvid.trim();
        }
    }

    /**
     * 設置 LGVID 參數
     * @param {string} lgvid - LGVID 值
     */
    setIframeLGVID(lgvid) {
        if (typeof lgvid === 'string' && lgvid.trim()) {
            this.iframeConfig.LGVID = lgvid.trim();
        }
    }

    /**
     * 設置是否顯示原價
     * @param {boolean} showOriginPrice - 是否顯示原價
     */
    setIframeShowOriginPrice(showOriginPrice) {
        this.iframeConfig.show_origin_price = showOriginPrice === true;
    }

    /**
     * 設置是否開啟 RouteLinkedTags 過濾
     * @param {boolean} useRouteLinkedTags - 是否開啟
     */
    setIframeUseRouteLinkedTags(useRouteLinkedTags) {
        this.iframeConfig.use_route_linked_tags = useRouteLinkedTags === true;
    }

    /**
     * 設置介紹模式
     * @param {null|'v1'|'v2'} introMode - 介紹模式（僅接受 null / 'v1' / 'v2'）
     */
    setIframeIntroMode(introMode) {
        this.iframeConfig.intro_mode = (introMode === 'v1' || introMode === 'v2') ? introMode : null;
    }

    /**
     * 設置 iframe UI 語系
     * @param {'zh-TW'|'en'|string} lang - 語系（'zh-TW' / 'en' 等；空值則清除）
     */
    setIframeLang(lang) {
        this.iframeConfig.lang = normalizeIframeLang(lang);
    }

    /**
     * 切換彈窗顯示狀態
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 獲取當前顯示狀態
     * @returns {boolean}
     */
    get visible() {
        return this.isVisible;
    }

    /**
     * 獲取當前 iframe URL
     * @returns {string|null}
     */
    get iframeUrl() {
        return this.currentIframeUrl;
    }
}

// 註冊 Web Component
if (!customElements.get(componentName)) {
    customElements.define(componentName, InfMarketingModalComponent);
}

// 全域註冊，方便動態創建
window.InfMarketingModalComponent = InfMarketingModalComponent;

class InfMarketingPopupBannerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.config = {
            position: 'RightDown', // 'LeftDown', 'RightDown', 'CenterDown', 'Center'
            title: parentUiT(PARENT_UI_DEFAULT_LANG, 'banner.defaultTitle'),
            description: parentUiT(PARENT_UI_DEFAULT_LANG, 'banner.defaultDescription'),
            buttonText: parentUiT(PARENT_UI_DEFAULT_LANG, 'banner.defaultCta'),
            buttonColor: '#ddd',
            buttonTextColor: '#1E1E19',
            todayDisplayMode: false, // 預設顯示 checkbox
            TimeValid: null // 時間有效性驗證
        };
        this.modalIframeUrl = null; // 智慧選物彈窗的 iframe URL
    }

    _getUiLang() {
        return getParentUiLang(this.getAttribute('ui-lang'));
    }

    _t(key, replacements) {
        return parentUiT(this._getUiLang(), key, replacements);
    }

    connectedCallback() {
        // 讀取 today-display-mode 屬性
        const todayDisplayMode = this.getAttribute('today-display-mode');
        this.config.todayDisplayMode = todayDisplayMode !== 'false';
        
        // 讀取 TimeValid 屬性
        const timeValidAttr = this.getAttribute('time-valid');
        if (timeValidAttr) {
            try {
                // 嘗試解析為 JSON（陣列格式）
                this.config.TimeValid = JSON.parse(timeValidAttr);
            } catch (e) {
                // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
                this.config.TimeValid = timeValidAttr;
            }
        }
        
        // 檢查時間有效性
        if (!this.isValidTimeRange()) {
            return; // 如果不在有效時間範圍內，則不渲染組件
        }
        
        // 檢查用戶是否選擇了「今日不再顯示」
        if (this.shouldHideToday()) {
            return; // 如果用戶選擇了今日不再顯示，則不渲染組件
        }
        
        this.render();
        this.setupEventListeners();
        
        // 監聽 iframe 消息
        this._setupIframeMessageListener();
    }

    /**
     * 檢查時間有效性
     * @returns {boolean} 是否在有效時間範圍內
     */
    isValidTimeRange() {
        if (!this.config.TimeValid) {
            return true; // 如果沒有設定時間限制，則視為有效
        }

        let startDate, endDate;

        // 處理字串格式 "2025-07-23~2025-08-01"
        if (typeof this.config.TimeValid === 'string') {
            const parts = this.config.TimeValid.split('~');
            if (parts.length === 2) {
                startDate = new Date(parts[0]);
                endDate = new Date(parts[1]);
            } else {
                return true; // 格式不正確，視為有效
            }
        }
        // 處理陣列格式 ["2025-07-23", "2025-08-01"]
        else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
            startDate = new Date(this.config.TimeValid[0]);
            endDate = new Date(this.config.TimeValid[1]);
        }
        else {
            return true; // 格式不正確，視為有效
        }

        // 檢查日期是否有效
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('TimeValid 日期格式無效:', this.config.TimeValid);
            return true; // 日期無效，視為有效
        }

        // 只比較日期部分，不考慮時間
        const now = new Date();
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        return nowDate >= startDateOnly && nowDate <= endDateOnly;
    }

    shouldHideToday() {
        const dontShowDate = localStorage.getItem('inf-marketing-popup-dont-show');
        if (!dontShowDate) {
            return false;
        }
        
        const today = new Date().toDateString();
        return dontShowDate === today;
    }

    static get observedAttributes() {
        return ['position', 'title', 'description', 'button-text', 'button-color', 'button-text-color', 'today-display-mode', 'time-valid', 'ui-lang'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'ui-lang':
                    break;
                case 'position':
                    this.config.position = newValue;
                break;
                case 'title':
                    this.config.title = newValue;
                break;
                case 'description':
                    this.config.description = newValue;
                break;
                case 'button-text':
                    this.config.buttonText = newValue;
                    break;
                case 'button-color':
                    this.config.buttonColor = newValue;
                    break;
                case 'button-text-color':
                    this.config.buttonTextColor = newValue;
                    break;
                case 'today-display-mode':
                    this.config.todayDisplayMode = newValue === 'true';
                    break;
                case 'time-valid':
                    if (newValue) {
                        try {
                            // 嘗試解析為 JSON（陣列格式）
                            this.config.TimeValid = JSON.parse(newValue);
                        } catch (e) {
                            // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
                            this.config.TimeValid = newValue;
                        }
                    } else {
                        this.config.TimeValid = null;
                    }
                    break;
            }
            
            // 檢查時間有效性
            if (!this.isValidTimeRange()) {
                // 如果不在有效時間範圍內，隱藏組件
                this.style.display = 'none';
                return;
            } else {
                // 如果在有效時間範圍內，顯示組件
                this.style.display = 'block';
            }
            
            this.render();
            this.setupEventListeners(); // 重新渲染後重新綁定事件監聽器
        }
    }

    getPositionStyles() {
        const positions = {
            'RightDown': {
                bottom: '20px',
                right: '20px',
                left: 'auto',
                top: 'auto',
                transform: 'none'
            },
            'LeftDown': {
                bottom: '20px',
                left: '20px',
                right: 'auto',
                top: 'auto',
                transform: 'none'
            },
            'CenterDown': {
                bottom: '20px',
                left: '50%',
                right: 'auto',
                top: 'auto',
                transform: 'translateX(-50%)'
            },
            'Center': {
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                transform: 'translate(-50%, -50%)'
            }
        };
        return positions[this.config.position] || positions['RightDown'];
    }

    getAnimationName() {
        const animations = {
            'RightDown': 'popupEnterBottomRight',
            'LeftDown': 'popupEnterBottomLeft',
            'CenterDown': 'popupEnterBottomCenter',
            'Center': 'popupEnterCenter'
        };
        return animations[this.config.position] || 'popupEnterBottomRight';
    }

    render() {
        const positionStyles = this.getPositionStyles();
        const animationName = this.getAnimationName();
        const closeLabel = escapeHtmlForTooltip(this._t('common.close'));
        const dontShowToday = escapeHtmlForTooltip(this._t('common.dontShowToday'));
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .popup-container {
                    position: relative;
                    border-radius: 12px;
                    background: #FCFCF8;
                    box-shadow: 0px 0px 18px 0px rgba(0, 0, 0, 0.15), 0px 0px 2px 0px rgba(0, 0, 0, 0.08), 0px 0px 1px 0px rgba(0, 0, 0, 0.15);
                    width: 368px;
                    max-width: calc(100vw - 40px); /* 確保兩側各有 20px 邊距 */
                    position: fixed;
                    bottom: ${positionStyles.bottom};
                    right: ${positionStyles.right};
                    left: ${positionStyles.left};
                    top: ${positionStyles.top};
                    transform: ${positionStyles.transform};
                    z-index: 9999;
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    
                    /* 添加動畫效果 */
                    animation: ${animationName} 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, 
                               continuousFloat 8s ease-in-out infinite 3s;
                    opacity: 0;
                }

                /* 手機版響應式設計 */
                @media (max-width: 480px) {
                    .popup-container {
                        width: 300px;
                        max-width: calc(100vw - 20px); /* 手機版兩側各 10px 邊距 */
                        padding: 8px;
                        border-radius: 10px;
                    }

                    .popup-content {
                        padding: 6px;
                        gap: 3px;
                    }
                    
                    .popup-content h1 {
                        font-size: 14px;
                        line-height: 18px;
                        letter-spacing: 0.6px;
                    }
                    
                    .popup-content p {
                        font-size: 11px;
                        line-height: 14px;
                    }
                    
                    .inf-marketing-popup-banner {
                        font-size: 14px;
                        line-height: 18px;
                        letter-spacing: 0.6px;
                        padding: 8px 12px;
                        min-width:55px;
                        width: fit-content;
                        max-width: 120px;
                    }
                }

                @media (max-width: 360px) {
                    .popup-container {
                        width: 280px;
                        max-width: calc(100vw - 16px); /* 小手機版兩側各 8px 邊距 */
                        padding: 6px;
                        border-radius: 8px;
                    }
                    
                    .popup-content {
                        padding: 4px;
                        gap: 2px;
                    }
                    
                    .popup-content h1 {
                        font-size: 13px;
                        line-height: 16px;
                        letter-spacing: 0.5px;
                    }
                    
                    .popup-content p {
                        font-size: 10px;
                        line-height: 12px;
                    }
                    
                    .inf-marketing-popup-banner {
                        font-size: 13px;
                        line-height: 16px;
                        letter-spacing: 0.5px;
                        padding: 6px 10px;
                        min-width:50px;
                        width: fit-content;
                        max-width: 120px;
                    }
                }

                /* 手機版定位調整 */
                @media (max-width: 480px) {
                    .popup-container {
                        /* 右下角定位調整 */
                        right: 10px !important;
                        bottom: 10px !important;
                    }
                    
                    /* 當定位為左下時 */
                    .popup-container[data-position="LeftDown"] {
                        left: 10px !important;
                        right: auto !important;
                        bottom: 10px !important;
                    }
                    
                    /* 當定位為正下方時 */
                    .popup-container[data-position="CenterDown"] {
                        left: 50% !important;
                        right: auto !important;
                        bottom: 10px !important;
                        transform: translateX(-50%) !important;
                    }
                    
                    /* 當定位為正中間時 */
                    .popup-container[data-position="Center"] {
                        top: 50% !important;
                        left: 50% !important;
                        right: auto !important;
                        bottom: auto !important;
                        transform: translate(-50%, -50%) !important;
                    }
                }

                @media (max-width: 360px) {
                    .popup-container {
                        /* 小手機版進一步調整邊距 */
                        right: 8px !important;
                        bottom: 8px !important;
                    }
                    
                    .popup-container[data-position="LeftDown"] {
                        left: 8px !important;
                        bottom: 8px !important;
                    }
                    
                    .popup-container[data-position="CenterDown"] {
                        bottom: 8px !important;
                    }
                }
                .popup-content-container{
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    padding-left: 0px;
                    gap: 4px;
                }
                .popup-content-image{
                display: flex;
                align-items: center;
                justify-content: center;
                height: 40px;
                width: 40px;
                }

                .popup-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .popup-content h1 {
                    color: #1E1E19;
                    font-family: "Noto Sans TC";
                    font-size: 15px;
                    font-style: normal;
                    font-weight: 700;
                    line-height: 20px;
                    letter-spacing: 0.9px;
                    margin: 0;
                }

                .popup-content p {
                    color: #1E1E19;
                    font-family: "Noto Sans TC";
                    font-size: 12px;
                    font-style: normal;
                    font-weight: 400;
                    margin: 0;
                }

                .inf-marketing-popup-banner {
                   min-width:60px;
                    width: fit-content;
                    max-width: 120px;
                    border-radius: 8px;
                    border: none;
                    background-color: ${this.config.buttonColor};
                    color: ${this.config.buttonTextColor};
                    font-family: "Noto Sans TC";
                    font-size: 15px;
                    font-style: normal;
                    font-weight: 700;
                    line-height: 20px;
                    letter-spacing: 0.9px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .inf-marketing-popup-banner:hover {
                    opacity: 0.8;
                    transform: translateY(-1px);
                }

                .close-button {
                    position: absolute;
                    top: -32px;
                    right: 0px;
                    background-color: #d3d3d3;
                    border: none;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    z-index: 10;
                    padding: 8px;
                }


                .close-button:hover {
                    background-color:rgb(178, 178, 178);
                }

                .dont-show-today-container {
                    position: absolute;
                    top: -20px;
                    left: 0;
                    padding: 0 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .dont-show-today-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    user-select: none;
                }

                .dont-show-today-checkbox {
                    width: 14px;
                    height: 14px;
                    margin: 0;
                    cursor: pointer;
                    accent-color: #1e1e19;
                }

                .dont-show-today-text {
                    color: #666;
                    font-family: "Noto Sans TC";
                    font-size: 11px;
                    font-weight: 400;
                    line-height: 14px;
                    letter-spacing: 0.3px;
                }

                /* 手機版響應式設計 */
                @media (max-width: 480px) {
                    .dont-show-today-container {
                        padding: 0 8px;
                    }

                    .dont-show-today-text {
                        font-size: 10px;
                        line-height: 12px;
                    }

                    .dont-show-today-checkbox {
                        width: 12px;
                        height: 12px;
                    }
                }

                @media (max-width: 360px) {
                    .dont-show-today-container {
                        margin-top: 5px;
                        padding: 0 6px;
                    }

                    .dont-show-today-text {
                        font-size: 9px;
                        line-height: 11px;
                    }

                    .dont-show-today-checkbox {
                        width: 11px;
                        height: 11px;
                    }
                }

                /* 添加懸浮動畫效果 */
                .popup-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 12px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                    pointer-events: none;
                    animation: popupGlow 6s ease-in-out infinite;
                }

                /* 輕微發光效果 */
                @keyframes popupGlow {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(252, 252, 248, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(252, 252, 248, 0.4);
                    }
                }

                /* 添加連續的輕微浮動效果 */
                @keyframes continuousFloat {
                    0%, 100% {
                        transform: ${positionStyles.transform === 'none' ? 'translateY(0)' : positionStyles.transform + ' translateY(0)'};
                    }
                    50% {
                        transform: ${positionStyles.transform === 'none' ? 'translateY(-2px)' : positionStyles.transform + ' translateY(-2px)'};
                    }
                }

                /* 從右下角進入動畫 */
                @keyframes popupEnterBottomRight {
                    0% {
                        transform: translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* 從左下角進入動畫 */
                @keyframes popupEnterBottomLeft {
                    0% {
                        transform: translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* 從正下方進入動畫 */
                @keyframes popupEnterBottomCenter {
                    0% {
                        transform: translateX(-50%) translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateX(-50%) translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateX(-50%) translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateX(-50%) translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }

                /* 從正中間進入動畫 */
                @keyframes popupEnterCenter {
                    0% {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                    30% {
                        transform: translate(-50%, -50%) scale(0.9);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translate(-50%, -50%) scale(1.05);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translate(-50%, -50%) scale(0.98);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            </style>
            <div class="popup-container" data-position="${this.config.position}">
                ${this.config.todayDisplayMode === true ? `
                <div class="dont-show-today-container">
                    <label class="dont-show-today-label">
                        <input type="checkbox" class="dont-show-today-checkbox" id="dont-show-today">
                        <span class="dont-show-today-text">${dontShowToday}</span>
                    </label>
                </div>
                ` : ''}
                <button class="close-button" title="${closeLabel}">
                     <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
        <div class="popup-content-container">
        <div class="popup-content-image">
<svg width="100%" height="100%" viewBox="0 0 37 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="37" height="32" fill="url(#pattern0_4706_65413)"/>
<defs>
<pattern id="pattern0_4706_65413" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_4706_65413" transform="matrix(0.00732936 0 0 0.00847458 -0.00572607 0)"/>
</pattern>
<image id="image0_4706_65413" width="138" height="118" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
        </div>
                <div class="popup-content">
                    <h1>${this.config.title}</h1>
                    <p>${this.config.description}</p>
                </div>
                </div>
                <button class="inf-marketing-popup-banner">
                    ${this.config.buttonText}
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('.inf-marketing-popup-banner');
        button.addEventListener('click', () => {
            trackInfMarketingGa4('popup_banner_open', {
                brand: this.getAttribute('brand') || '',
                route: this.getAttribute('iframe-id') || '',
                event_label: 'open_smart_selection',
                action: 'open'
            });
            // 使用預設的智慧選物 URL
            const defaultUrl = 'https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1';
            this.showSmartSelectionModal(this.modalIframeUrl || defaultUrl);
        });

        // 支援移動設備觸摸事件
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            trackInfMarketingGa4('popup_banner_open', {
                brand: this.getAttribute('brand') || '',
                route: this.getAttribute('iframe-id') || '',
                event_label: 'open_smart_selection',
                action: 'open'
            });
            const defaultUrl = 'https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1';
            this.showSmartSelectionModal(this.modalIframeUrl || defaultUrl);
        }, { passive: false });

        const closeButton = this.shadowRoot.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            trackInfMarketingGa4('popup_banner_close', {
                brand: this.getAttribute('brand') || '',
                route: this.getAttribute('iframe-id') || '',
                event_label: 'close',
                action: 'close'
            });
            this.dispatchEvent(new CustomEvent('inf-marketing-popup-banner-close'));
        });

        // 支援移動設備觸摸事件
        closeButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            trackInfMarketingGa4('popup_banner_close', {
                brand: this.getAttribute('brand') || '',
                route: this.getAttribute('iframe-id') || '',
                event_label: 'close',
                action: 'close'
            });
            this.dispatchEvent(new CustomEvent('inf-marketing-popup-banner-close'));
        }, { passive: false });

        // 添加 checkbox 事件監聽器（僅當 checkbox 存在時）
        const checkbox = this.shadowRoot.querySelector('.dont-show-today-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                trackInfMarketingGa4(isChecked ? 'popup_banner_dont_show_today_on' : 'popup_banner_dont_show_today_off', {
                    brand: this.getAttribute('brand') || '',
                    route: this.getAttribute('iframe-id') || '',
                    event_label: isChecked ? 'dont_show_today_on' : 'dont_show_today_off',
                    action: 'dont_show_today'
                });
                // 將用戶選擇儲存到 localStorage
                if (isChecked) {
                    const today = new Date().toDateString();
                    localStorage.setItem('inf-marketing-popup-dont-show', today);
                } else {
                    localStorage.removeItem('inf-marketing-popup-dont-show');
                }
            });
        }
    }

    // 顯示智慧選物彈窗（與 square card banner 組件完全相同）
    showSmartSelectionModal(iframeUrl = null) {
        // 尋找或創建獨立的彈窗組件
        let modal = document.querySelector('#inf-smart-selection-modal');
        
        if (!modal) {
            // 檢查是否已載入彈窗組件
            if (typeof window.InfMarketingModalComponent === 'undefined') {
                console.error('inf-marketing-modal-component.js 尚未載入，請確保已引入該檔案');
                return;
            }

            // 動態創建彈窗組件
            modal = document.createElement('inf-marketing-modal');
            modal.id = 'inf-smart-selection-modal';
            modal.setAttribute('ui-lang', this.getAttribute('ui-lang') || PARENT_UI_DEFAULT_LANG);
            
            // 添加默認內容
            modal.innerHTML = getModalFallbackContentHtml(this.getAttribute('ui-lang'));
            
            document.body.appendChild(modal);
        }

        if (modal && this.getAttribute('ui-lang')) {
            modal.setAttribute('ui-lang', this.getAttribute('ui-lang'));
        }
        
        // 設置 iframe 配置參數（如果組件支援）
        if (modal.setIframeConfig && typeof modal.setIframeConfig === 'function') {
            modal.setIframeConfig({
                id: this.getAttribute('iframe-id') || '',
                brand: this.getAttribute('brand') || '',
                header: 'from_preview'
            });
        }
        
        // 確保組件已完全初始化後再調用方法
        if (modal.show && typeof modal.show === 'function') {
            // 統一透過 setIframeUrl 方法設置 iframe，然後顯示彈窗
            if (iframeUrl && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                modal.setIframeUrl(iframeUrl);
            }
            modal.show();
        } else {
            // 如果組件還沒完全載入，等待一段時間後重試
            setTimeout(() => {
                // 設置 iframe 配置參數（重試時）
                if (modal.setIframeConfig && typeof modal.setIframeConfig === 'function') {
                    modal.setIframeConfig({
                        id: this.getAttribute('iframe-id') || '',
                        brand: this.getAttribute('brand') || '',
                        header: 'from_preview'
                    });
                }
                
                if (modal.show && typeof modal.show === 'function') {
                    if (iframeUrl && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                        modal.setIframeUrl(iframeUrl);
                    }
                    modal.show();
                } else {
                    console.error('彈窗組件初始化失敗，請檢查 inf-marketing-modal-component.js 是否正確載入');
                }
            }, 100);
        }
    }

    // 設置彈窗 iframe URL
    setModalIframeUrl(url) {
        // 儲存 URL 供後續使用
        this.modalIframeUrl = url;
        
        const modal = document.querySelector('#inf-smart-selection-modal');
        if (modal && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
            modal.setIframeUrl(url);
        } else if (modal) {
            // 如果方法還沒載入，使用 requestAnimationFrame 進行輪詢檢查
            const waitForSetIframeUrl = () => {
                if (modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                    modal.setIframeUrl(url);
                } else {
                    // 如果方法還沒載入，繼續下一幀檢查
                    requestAnimationFrame(waitForSetIframeUrl);
                }
            };
            
            requestAnimationFrame(waitForSetIframeUrl);
        }
    }

    // 隱藏智慧選物彈窗
    hideSmartSelectionModal() {
        const modal = document.querySelector('#inf-marketing-modal-component.js');
        if (modal && modal.hide && typeof modal.hide === 'function') {
            modal.hide();
        } else if (modal) {
            // 如果方法還沒載入，使用 requestAnimationFrame 進行輪詢檢查
            const waitForHide = () => {
                if (modal.hide && typeof modal.hide === 'function') {
                    modal.hide();
                } else {
                    // 如果方法還沒載入，繼續下一幀檢查
                    requestAnimationFrame(waitForHide);
                }
            };
            
            requestAnimationFrame(waitForHide);
        }
    }

    // 隱藏組件
    hide() {
        // 隱藏彈窗橫幅
        this.style.display = 'none';
        
        // 如果智慧選物彈窗開啟，也關閉它
        this.hideSmartSelectionModal();
        
        // 觸發隱藏事件
        this.dispatchEvent(new CustomEvent('inf-marketing-popup-banner-hide'));
    }

    // 顯示組件
    show() {
        // 檢查時間有效性和用戶選擇
        if (this.isValidTimeRange() && !this.shouldHideToday()) {
            this.style.display = 'block';
            // 觸發顯示事件
            this.dispatchEvent(new CustomEvent('inf-marketing-popup-banner-show'));
        }
    }

    // 公開方法來更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.render();
        this.setupEventListeners(); // 重新渲染後重新綁定事件監聽器
    }

    // 監聽 iframe 消息
    _setupIframeMessageListener() {
        // 綁定 this 上下文
        this._boundHandleIframeMessage = this._handleIframeMessage.bind(this);
        
        // 監聽來自 iframe 的 postMessage
        window.addEventListener('message', this._boundHandleIframeMessage);
    }

    // 處理 iframe 消息
    _handleIframeMessage(event) {
        try {
            // 檢查消息格式
            if (event.data && typeof event.data === 'object') {
                const { type, value } = event.data;
                
                // 監聽 iframe 回傳值 type === 'result'
                if (type === 'result') {
                    if (value) {
                        // 有搜尋結果時，記錄狀態並在彈窗關閉時顯示結果狀態
                        this._hasResult = true;
                        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
                        if (trigger && trigger.classList.contains('ai-pd-container__trigger--search')) {
                            // 只有在搜尋狀態（彈窗關閉）時才切換到結果狀態
                            this.setResultState();
                        }
                    } else {
                        // 沒有搜尋結果時，清除結果狀態並重置為搜尋狀態
                        this._hasResult = false;
                        this.resetToSearchState();
                    }
                }
                if (type === 'run_routeproduct_success') {
                    // console.log('run_routeproduct_success');
                   window.showInfMarketing();
                }
            }
        } catch (error) {
            console.warn('處理 iframe 消息時發生錯誤:', error);
        }
    }

    // 移除 iframe 消息監聽器
    _removeIframeMessageListener() {
        if (this._boundHandleIframeMessage) {
            window.removeEventListener('message', this._boundHandleIframeMessage);
        }
    }

    // 設置結果狀態（當有搜尋結果時調用）
    setResultState() {
        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
        if (!trigger) return;
        
        trigger.classList.remove('ai-pd-container__trigger--search');
        trigger.classList.remove('ai-pd-container__trigger--close');
        trigger.classList.add('ai-pd-container__trigger--result');
        trigger.title = this._t('float.viewResults');
    }

    // 重置為搜尋狀態
    resetToSearchState() {
        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
        if (!trigger) return;
        
        trigger.classList.remove('ai-pd-container__trigger--result');
        trigger.classList.remove('ai-pd-container__trigger--close');
        trigger.classList.add('ai-pd-container__trigger--search');
        trigger.title = this._t('float.openSmartSelection');
    }

    disconnectedCallback() {
        this._removeIframeMessageListener();
    }
}

customElements.define('inf-marketing-popup-banner', InfMarketingPopupBannerComponent);

class InfMarketingSquareCardBannerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.imageData = [];
        this.currentIndex = 0;
        this.isVisible = false;
        this.isInitialized = false;
        this.autoplayTimer = null;
        this.modalIframeUrl = null; // 智慧選物彈窗的 iframe URL
        this.config = {
            todayDisplayMode: true, // 預設顯示 checkbox
            TimeValid: null // 時間有效性驗證
        };

        // 拖拽相關變數
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 50; // 拖拽觸發閾值
        this.dragStartTime = 0; // 觸摸開始時間
    }

    _getUiLang() {
        return getParentUiLang(this.getAttribute('ui-lang'));
    }

    _t(key, replacements) {
        return parentUiT(this._getUiLang(), key, replacements);
    }

    static get observedAttributes() {
        return ['position', 'images', 'width', 'height', 'auto-show', 'show-arrows', 'autoplay-speed', 'today-display-mode', 'time-valid', 'ui-lang'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isInitialized) {
            if (name === 'ui-lang') {
                this.render();
                this.setupEventListeners();
                if (this.imageData.length > 0) {
                    this.createSlides();
                    this.updateCounter();
                    this.updateArrowsVisibility();
                }
                return;
            }
            if (name === 'position' || name === 'width' || name === 'height') {
                this.updateStyles();
            } else if (name === 'images') {
                this.updateImages();
            } else if (name === 'show-arrows') {
                this.updateArrowsVisibility();
            } else if (name === 'autoplay-speed') {
                this.stopAutoplay();
                if (this.isVisible) {
                    this.startAutoplay();
                }
            } else if (name === 'today-display-mode') {
                this.config.todayDisplayMode = newValue === 'true';
                this.render();
            } else if (name === 'time-valid') {
                if (newValue) {
                    try {
                        // 嘗試解析為 JSON（陣列格式）
                        this.config.TimeValid = JSON.parse(newValue);
                    } catch (e) {
                        // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
                        this.config.TimeValid = newValue;
                    }
                } else {
                    this.config.TimeValid = null;
                }
                
                // 檢查時間有效性
                if (!this.isValidTimeRange()) {
                    // 如果不在有效時間範圍內，隱藏組件
                    this.style.display = 'none';
                    return;
                } else {
                    // 如果在有效時間範圍內，顯示組件
                    this.style.display = 'block';
                }
                
                this.render();
            }
        }
    }

    connectedCallback() {
        // 讀取 today-display-mode 屬性
        const todayDisplayMode = this.getAttribute('today-display-mode');
        this.config.todayDisplayMode = todayDisplayMode !== 'false';
        
        // 讀取 TimeValid 屬性
        const timeValidAttr = this.getAttribute('time-valid');
        if (timeValidAttr) {
            try {
                // 嘗試解析為 JSON（陣列格式）
                this.config.TimeValid = JSON.parse(timeValidAttr);
            } catch (e) {
                // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
                this.config.TimeValid = timeValidAttr;
            }
        }
        
        // 檢查時間有效性
        if (!this.isValidTimeRange()) {
            return; // 如果不在有效時間範圍內，則不渲染組件
        }
        
        // 檢查用戶是否選擇了「今日不再顯示」
        if (this.shouldHideToday()) {
            return; // 如果用戶選擇了今日不再顯示，則不渲染組件
        }
        
        this.render();
        this.initializeComponent();
        this.adjustModalHeightForMobile(); // 新增：初始化時調整
        window.addEventListener('resize', this.adjustModalHeightForMobile.bind(this));
        
        // 監聽 iframe 消息
        this._setupIframeMessageListener();
    }

    shouldHideToday() {
        const dontShowDate = localStorage.getItem('inf-marketing-square-card-dont-show');
        if (!dontShowDate) {
            return false;
        }
        
        const today = new Date().toDateString();
        return dontShowDate === today;
    }

    disconnectedCallback() {
        this.stopAutoplay();
        window.removeEventListener('resize', this.adjustModalHeightForMobile.bind(this)); // 清理事件
        this._removeIframeMessageListener();
    }

    /**
     * 檢查時間有效性
     * @returns {boolean} 是否在有效時間範圍內
     */
    isValidTimeRange() {
        if (!this.config.TimeValid) {
            return true; // 如果沒有設定時間限制，則視為有效
        }

        let startDate, endDate;

        // 處理字串格式 "2025-07-23~2025-08-01"
        if (typeof this.config.TimeValid === 'string') {
            const parts = this.config.TimeValid.split('~');
            if (parts.length === 2) {
                startDate = new Date(parts[0]);
                endDate = new Date(parts[1]);
            } else {
                return true; // 格式不正確，視為有效
            }
        }
        // 處理陣列格式 ["2025-07-23", "2025-08-01"]
        else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
            startDate = new Date(this.config.TimeValid[0]);
            endDate = new Date(this.config.TimeValid[1]);
        }
        else {
            return true; // 格式不正確，視為有效
        }

        // 檢查日期是否有效
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('TimeValid 日期格式無效:', this.config.TimeValid);
            return true; // 日期無效，視為有效
        }

        // 只比較日期部分，不考慮時間
        const now = new Date();
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        return nowDate >= startDateOnly && nowDate <= endDateOnly;
    }

    // 更新樣式
    updateStyles() {
        const infCard = this.shadowRoot.querySelector('#inf-marketing-square-card-banner');
        if (infCard) {
            const width = this.getAttribute('width') || '300px';
            const height = this.getAttribute('height') || '300px';
            const positionStyle = this.getPositionStyle();
            const positionTransform = this.getPositionTransform();
            const showTransform = this.getShowTransform();

            infCard.style.width = width;
            infCard.style.height = height;

            // 重新設置位置
            infCard.style.top = '';
            infCard.style.bottom = '';
            infCard.style.left = '';
            infCard.style.right = '';
            infCard.style.transform = '';

            const styleRules = positionStyle.split(';').filter(rule => rule.trim());
            styleRules.forEach(rule => {
                const [property, value] = rule.split(':').map(s => s.trim());
                if (property && value) {
                    infCard.style[property] = value;
                }
            });

            // 根據當前顯示狀態設置正確的 transform
            if (this.isVisible) {
                infCard.style.transform = showTransform;
            } else {
                infCard.style.transform = positionTransform;
            }
        }
    }

    // 更新圖片
    updateImages() {
        const imagesAttr = this.getAttribute('images');
        if (imagesAttr) {
            try {
                this.imageData = JSON.parse(imagesAttr);
                this.currentIndex = 0;
                this.createSlides();
                this.updateCounter();
            } catch (e) {
                console.error('圖片數據解析失敗:', e);
            }
        }
    }

    // 更新箭頭顯示狀態
    updateArrowsVisibility() {
        const showArrows = this.getAttribute('show-arrows') !== 'false';
        const navButtons = this.shadowRoot.querySelectorAll('.nav-button');

        navButtons.forEach(button => {
            button.style.display = showArrows ? 'flex' : 'none';
        });
    }

    // 設置圖片數據
    setImages(imageData) {
        if (!Array.isArray(imageData) || imageData.length === 0) {
            console.error('圖片數據格式錯誤');
            return;
        }

        this.imageData = imageData;
        this.currentIndex = 0;

        if (this.isInitialized) {
            this.createSlides();
            this.updateCounter();
            this.startAutoplay();
        }
    }

    // 顯示卡片
    show() {
        if (this.imageData.length === 0) {
            console.warn('沒有圖片數據');
            return;
        }

        const infCard = this.shadowRoot.querySelector('#inf-marketing-square-card-banner');
        if (!infCard) return;

        setTimeout(() => {
            infCard.classList.add('show');
            this.isVisible = true;
            this.startAutoplay();
            this.dispatchEvent(new CustomEvent('inf-marketing-square-card-banner-show'));
        }, 100);
    }

    // 隱藏卡片
    hide() {
        const infCard = this.shadowRoot.querySelector('#inf-marketing-square-card-banner');
        if (infCard) {
            infCard.classList.remove('show');
            this.isVisible = false;
            this.stopAutoplay();

            // 移除觸發會導致組件被移除的事件
            // setTimeout(() => {
            //     this.dispatchEvent(new CustomEvent('inf-marketing-square-card-banner-hide'));
            // }, 600);
        }
    }

    // 創建圖片slides
    createSlides() {
        const slideContainer = this.shadowRoot.querySelector('.slide-container');
        if (!slideContainer) return;

        slideContainer.innerHTML = '';

        this.imageData.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = `slide ${index === 0 ? 'active' : ''}`;

            const img = document.createElement('img');
            img.src = item.image;
            img.loading = 'lazy';
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                cursor: pointer;
            `;

            // 處理圖片點擊事件的函數
            const handleImageClick = (e) => {
                e.stopPropagation();

                // 防止拖拽後的點擊事件
                if (this.isDragging || Math.abs(this.currentX - this.startX) > 5) {
                    return;
                }

                // 獲取當前顯示的圖片數據（而不是被點擊的圖片元素的索引）
                const currentItem = this.imageData[this.currentIndex];
                if (!currentItem) return;

                const gaBrand = this.getAttribute('brand') || '';
                const gaRoute = this.getAttribute('iframe-id') || '';

                // 根據當前顯示圖片的 Title 判斷是否為智慧選物
                if (isSmartSelectionCardItem(currentItem)) {
                    trackInfMarketingGa4('square_card_open', {
                        brand: gaBrand,
                        route: gaRoute,
                        event_label: 'open_smart_selection',
                        action: 'modal',
                        extra: { card_title: currentItem.Title || '', card_index: this.currentIndex }
                    });
                    // 使用預設的智慧選物 URL 或現有的 iframe URL
                    const defaultUrl = 'https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1';
                    this.showSmartSelectionModal(this.modalIframeUrl || defaultUrl);
                    this.dispatchEvent(new CustomEvent('inf-marketing-square-card-banner-click', {
                        detail: {
                            image: currentItem.image,
                            title: currentItem.Title,
                            index: this.currentIndex,
                            action: 'modal'
                        }
                    }));
                } else if (currentItem.url) {
                    trackInfMarketingGa4('square_card_navigate', {
                        brand: gaBrand,
                        route: gaRoute,
                        event_label: 'navigate',
                        action: 'navigate',
                        extra: { card_title: currentItem.Title || '', card_index: this.currentIndex }
                    });
                    window.open(currentItem.url, '_blank');
                    this.dispatchEvent(new CustomEvent('inf-marketing-square-card-banner-click', {
                        detail: {
                            image: currentItem.image,
                            url: currentItem.url,
                            title: currentItem.Title,
                            index: this.currentIndex,
                            action: 'navigate'
                        }
                    }));
        } else {
                    trackInfMarketingGa4('square_card_click', {
                        brand: gaBrand,
                        route: gaRoute,
                        event_label: 'click',
                        action: 'click',
                        extra: { card_title: currentItem.Title || '', card_index: this.currentIndex }
                    });
                    // 如果沒有 URL，也觸發一個一般性的點擊事件
                    this.dispatchEvent(new CustomEvent('inf-marketing-square-card-banner-click', {
                        detail: {
                            image: currentItem.image,
                            title: currentItem.Title,
                            index: this.currentIndex,
                            action: 'click'
                        }
                    }));
                }
            };

            // 桌面版點擊事件
            img.addEventListener('click', handleImageClick);
            
            // 移動版觸摸點擊事件
            img.addEventListener('touchend', (e) => {
                // 只在短暫觸摸（非拖拽）時觸發點擊
                if (!this.isDragging && Math.abs(this.currentX - this.startX) <= 5) {
                    e.preventDefault(); // 防止觸發額外的點擊事件
                    handleImageClick(e);
                }
            }, { passive: false });

            slide.appendChild(img);
            slideContainer.appendChild(slide);
        });

    }

    // 切換到下一張
    nextSlide() {
        if (this.imageData.length <= 1) return;

        const currentSlide = this.shadowRoot.querySelector('.slide.active');
        if (currentSlide) {
            currentSlide.classList.remove('active');
        }

        this.currentIndex = (this.currentIndex + 1) % this.imageData.length;

        const nextSlide = this.shadowRoot.querySelectorAll('.slide')[this.currentIndex];
        if (nextSlide) {
            nextSlide.classList.add('active');
        }

        this.updateCounter();
    }

    // 切換到上一張
    prevSlide() {
        if (this.imageData.length <= 1) return;

        const currentSlide = this.shadowRoot.querySelector('.slide.active');
        if (currentSlide) {
            currentSlide.classList.remove('active');
        }

        this.currentIndex = this.currentIndex === 0 ? this.imageData.length - 1 : this.currentIndex - 1;

        const prevSlide = this.shadowRoot.querySelectorAll('.slide')[this.currentIndex];
        if (prevSlide) {
            prevSlide.classList.add('active');
        }

        this.updateCounter();
    }

    // 更新計數器
    updateCounter() {
        const counter = this.shadowRoot.querySelector('.image-counter');
        if (counter && this.imageData.length > 0) {
            counter.textContent = `${this.currentIndex + 1}/${this.imageData.length}`;
        }
    }

    // 開始自動播放
    startAutoplay() {
        if (this.imageData.length <= 1) return;

        this.stopAutoplay();
        const speed = parseInt(this.getAttribute('autoplay-speed')) || 3000;
        this.autoplayTimer = setInterval(() => {
            if (this.isVisible) {
                this.nextSlide();
            }
        }, speed);
    }

    // 停止自動播放
    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    // 顯示智慧選物彈窗
    showSmartSelectionModal(iframeUrl = null) {
        // 尋找或創建獨立的彈窗組件
        let modal = document.querySelector('#inf-smart-selection-modal');
        
        if (!modal) {
            // 檢查是否已載入彈窗組件
            if (typeof window.InfMarketingModalComponent === 'undefined') {
                console.error('inf-marketing-modal-component.js 尚未載入，請確保已引入該檔案');
                return;
            }
            
            // 動態創建彈窗組件
            modal = document.createElement('inf-marketing-modal');
            modal.id = 'inf-smart-selection-modal';
            modal.setAttribute('ui-lang', this.getAttribute('ui-lang') || PARENT_UI_DEFAULT_LANG);
            
            // 添加默認內容
            modal.innerHTML = getModalFallbackContentHtml(this.getAttribute('ui-lang'));
            
            document.body.appendChild(modal);
        }

        if (modal && this.getAttribute('ui-lang')) {
            modal.setAttribute('ui-lang', this.getAttribute('ui-lang'));
        }
        
        // 設置 iframe 配置參數（如果組件支援）
        if (modal.setIframeConfig && typeof modal.setIframeConfig === 'function') {
            modal.setIframeConfig({
                id: this.getAttribute('iframe-id') || '',
                brand: this.getAttribute('brand') || '',
                header: 'from_preview'
            });
        }
        
        // 確保組件已完全初始化後再調用方法
        if (modal.show && typeof modal.show === 'function') {
            // 統一透過 setIframeUrl 方法設置 iframe，然後顯示彈窗
            if (iframeUrl && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                modal.setIframeUrl(iframeUrl);
            }
            modal.show();
        } else {
            // 如果組件還沒完全載入，使用 requestAnimationFrame 進行輪詢檢查
            const waitForModalMethods = () => {
                if (modal.setIframeConfig && typeof modal.setIframeConfig === 'function' &&
                    modal.show && typeof modal.show === 'function') {
                    
                    // 設置 iframe 配置參數
                    modal.setIframeConfig({
                        id: this.getAttribute('iframe-id') || '',
                        brand: this.getAttribute('brand') || '',
                        header: 'from_preview'
                    });

                    if (iframeUrl && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                        modal.setIframeUrl(iframeUrl);
                    }
                    modal.show();
                } else {
                    // 如果方法還沒載入，繼續下一幀檢查
                    requestAnimationFrame(waitForModalMethods);
                }
            };
            
            requestAnimationFrame(waitForModalMethods);
        }
    }

    // 設置彈窗 iframe URL
    setModalIframeUrl(url) {
        // 儲存 URL 供後續使用
        this.modalIframeUrl = url;
        
        const modal = document.querySelector('#inf-smart-selection-modal');
        if (modal && modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
            modal.setIframeUrl(url);
        } else if (modal) {
            // 如果方法還沒載入，稍後重試
            setTimeout(() => {
                if (modal.setIframeUrl && typeof modal.setIframeUrl === 'function') {
                    modal.setIframeUrl(url);
                }
            }, 100);
        }
    }

    // 隱藏智慧選物彈窗
    hideSmartSelectionModal() {
        const modal = document.querySelector('#inf-smart-selection-modal');
        if (modal && modal.hide && typeof modal.hide === 'function') {
            modal.hide();
        } else if (modal) {
            // 如果方法還沒載入，稍後重試
            setTimeout(() => {
                if (modal.hide && typeof modal.hide === 'function') {
                    modal.hide();
                }
            }, 100);
        }
    }

    // 監聽 iframe 消息
    _setupIframeMessageListener() {
        // 綁定 this 上下文
        this._boundHandleIframeMessage = this._handleIframeMessage.bind(this);
        
        // 監聽來自 iframe 的 postMessage
        window.addEventListener('message', this._boundHandleIframeMessage);
    }

    // 處理 iframe 消息
    _handleIframeMessage(event) {
        try {
            // 檢查消息格式
            if (event.data && typeof event.data === 'object') {
                const { type, value } = event.data;
                
                // 監聽 iframe 回傳值 type === 'result'
                if (type === 'result') {
                    if (value) {
                        // 有搜尋結果時，記錄狀態並在彈窗關閉時顯示結果狀態
                        this._hasResult = true;
                        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
                        if (trigger && trigger.classList.contains('ai-pd-container__trigger--search')) {
                            // 只有在搜尋狀態（彈窗關閉）時才切換到結果狀態
                            this.setResultState();
                        }
                    } else {
                        // 沒有搜尋結果時，清除結果狀態並重置為搜尋狀態
                        this._hasResult = false;
                        this.resetToSearchState();
                    }
                }
                if (type === 'run_routeproduct_success') {
                    // console.log('run_routeproduct_success');
                   window.showInfMarketing();
                }
            }
        } catch (error) {
            console.warn('處理 iframe 消息時發生錯誤:', error);
        }
    }

    // 移除 iframe 消息監聽器
    _removeIframeMessageListener() {
        if (this._boundHandleIframeMessage) {
            window.removeEventListener('message', this._boundHandleIframeMessage);
        }
    }

    // 設置結果狀態（當有搜尋結果時調用）
    setResultState() {
        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
        if (!trigger) return;
        
        trigger.classList.remove('ai-pd-container__trigger--search');
        trigger.classList.remove('ai-pd-container__trigger--close');
        trigger.classList.add('ai-pd-container__trigger--result');
        trigger.title = this._t('float.viewResults');
    }

    // 重置為搜尋狀態
    resetToSearchState() {
        const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
        if (!trigger) return;
        
        trigger.classList.remove('ai-pd-container__trigger--result');
        trigger.classList.remove('ai-pd-container__trigger--close');
        trigger.classList.add('ai-pd-container__trigger--search');
        trigger.title = this._t('float.openSmartSelection');
    }

    // 拖拽開始
    handleDragStart(e) {
        this.isDragging = false; // 初始設為 false，等移動後再設為 true
        this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        this.currentX = this.startX;
        this.dragStartTime = Date.now(); // 記錄觸摸開始時間
        this.stopAutoplay(); // 拖拽時暫停自動播放

        // 防止圖片被選中或拖拽
        e.preventDefault();
    }

    // 拖拽中
    handleDragMove(e) {
        this.currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const deltaX = this.currentX - this.startX;

        // 只有移動距離超過 10px 時才認為是拖拽
        if (!this.isDragging && Math.abs(deltaX) > 10) {
            this.isDragging = true;
            
            // 添加拖拽樣式
            const slideContainer = this.shadowRoot.querySelector('.slide-container');
            if (slideContainer) {
                slideContainer.classList.add('dragging');
                slideContainer.style.transition = '';
            }
        }

        if (this.isDragging) {
            // 輕微的視覺反饋，不影響切換動畫
            const slideContainer = this.shadowRoot.querySelector('.slide-container');
            if (slideContainer) {
                // 只添加很輕微的縮放效果作為拖拽反饋
                const scale = 1 - Math.abs(deltaX) * 0.0001;
                // slideContainer.style.transform = `scale(${Math.max(0.98, scale)})`;
            }
            
            e.preventDefault();
        }
    }

    // 拖拽結束
    handleDragEnd(e) {
        const deltaX = this.currentX - this.startX;
        const touchTime = Date.now() - this.dragStartTime;
        const wasDragging = this.isDragging;
        
        this.isDragging = false;

        // 重置視覺效果和樣式
        const slideContainer = this.shadowRoot.querySelector('.slide-container');
        if (slideContainer) {
            // 平滑地重置縮放效果
            slideContainer.style.transition = 'transform 0.3s ease';
            slideContainer.style.transform = 'scale(1)';
            slideContainer.classList.remove('dragging');

            // 清除過渡效果，避免干擾opacity動畫
            setTimeout(() => {
                slideContainer.style.transition = '';
            }, 300);
        }

        // 只有真正拖拽時才處理滑動切換
        if (wasDragging && Math.abs(deltaX) > this.threshold) {
            if (deltaX > 0) {
                // 向右拖拽，顯示上一張
                this.prevSlide();
            } else {
                // 向左拖拽，顯示下一張
                this.nextSlide();
            }
        } else {
            // 拖拽距離不足時，平滑重置
            setTimeout(() => {
                if (slideContainer) {
                    slideContainer.style.transform = '';
                }
            }, 300);
        }

        // 5秒後重新開始自動播放
        setTimeout(() => {
            if (this.isVisible) {
                this.startAutoplay();
            }
        }, 5000);

        if (wasDragging) {
            e.preventDefault();
        }
    }

    // 初始化組件
    initializeComponent() {
        if (this.isInitialized) return;

        const imagesAttr = this.getAttribute('images');
        if (imagesAttr) {
            try {
                this.imageData = JSON.parse(imagesAttr);
            } catch (e) {
                console.error('圖片數據解析失敗:', e);
                this.imageData = [];
            }
        }

        if (this.imageData.length > 0) {
            this.createSlides();
            this.updateCounter();

            if (this.getAttribute('auto-show') !== 'false') {
                setTimeout(() => {
                    this.show();
                }, 300);
            }
        }

        this.bindEvents();
        this.updateArrowsVisibility(); // 初始化箭頭顯示狀態
        this.isInitialized = true;
    }

    // 綁定事件
    bindEvents() {
        const closeButton = this.shadowRoot.querySelector('.close-button');
        if (closeButton) {
            const handleClose = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hide();
            };
            
            closeButton.addEventListener('click', handleClose);
            closeButton.addEventListener('touchend', handleClose, { passive: false });
        }

        // 左右箭頭按鈕
        const prevButton = this.shadowRoot.querySelector('.nav-button.prev');
        const nextButton = this.shadowRoot.querySelector('.nav-button.next');

        if (prevButton) {
            const handlePrev = (e) => {
                e.stopPropagation();
                this.prevSlide();
                this.stopAutoplay();
                setTimeout(() => this.startAutoplay(), 5000); // 5秒後重新開始自動播放
            };
            
            prevButton.addEventListener('click', handlePrev);
            prevButton.addEventListener('touchend', handlePrev, { passive: false });
        }

        if (nextButton) {
            const handleNext = (e) => {
                e.stopPropagation();
                this.nextSlide();
                this.stopAutoplay();
                setTimeout(() => this.startAutoplay(), 5000); // 5秒後重新開始自動播放
            };
            
            nextButton.addEventListener('click', handleNext);
            nextButton.addEventListener('touchend', handleNext, { passive: false });
        }

        // 添加 checkbox 事件監聽器
        const checkbox = this.shadowRoot.querySelector('.dont-show-today-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                // 將用戶選擇儲存到 localStorage
                if (isChecked) {
                    const today = new Date().toDateString();
                    localStorage.setItem('inf-marketing-square-card-dont-show', today);
                } else {
                    localStorage.removeItem('inf-marketing-square-card-dont-show');
                }
            });
        }

        // 彈窗相關事件已移至獨立的 inf-marketing-modal 組件中處理

        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'Escape') {
                    // 如果彈窗開啟，先關閉彈窗
                    const modal = document.querySelector('#inf-smart-selection-modal');
                    if (modal && modal.visible === true) {
                        this.hideSmartSelectionModal();
                    } else {
                        this.hide();
                    }
                } else if (e.key === 'ArrowLeft') {
                    this.prevSlide();
                } else if (e.key === 'ArrowRight') {
                    this.nextSlide();
                    }
                }
            });

        // 鼠標懸停時暫停自動播放
        const infCard = this.shadowRoot.querySelector('#inf-marketing-square-card-banner');
        if (infCard) {
            infCard.addEventListener('mouseenter', () => {
                this.stopAutoplay();
            });

            infCard.addEventListener('mouseleave', () => {
                if (this.isVisible && !this.isDragging) {
                    this.startAutoplay();
                }
            });

            // 綁定拖拽事件 - 觸摸設備
            infCard.addEventListener('touchstart', (e) => this.handleDragStart(e), {
                passive: false
            });
            infCard.addEventListener('touchmove', (e) => this.handleDragMove(e), {
                passive: false
            });
            infCard.addEventListener('touchend', (e) => this.handleDragEnd(e), {
                passive: false
            });

            // 綁定拖拽事件 - 鼠標
            infCard.addEventListener('mousedown', (e) => this.handleDragStart(e));

            // 鼠標事件需要綁定到 document，防止拖拽超出範圍
            document.addEventListener('mousemove', (e) => this.handleDragMove(e));
            document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        }
    }

    // 獲取位置樣式
    getPositionStyle() {
        const position = this.getAttribute('position') || 'RightDown';
        const positions = {
            'RightDown': 'bottom: 20px; right: 20px;',
            'LeftDown': 'bottom: 20px; left: 20px;',
            'CenterDown': 'bottom: 20px; left: 50%;',
            'Center': 'top: 50%; left: 50%;'
        };

        return positions[position] || positions['RightDown'];
    }

    // 獲取位置特定的 transform 樣式
    getPositionTransform() {
        const position = this.getAttribute('position') || 'RightDown';
        const transforms = {
            'RightDown': 'translateY(40px) scale(0.85)',
            'LeftDown': 'translateY(40px) scale(0.85)',
            'CenterDown': 'translateX(-50%) translateY(40px) scale(0.85)',
            'Center': 'translate(-50%, -50%) translateY(40px) scale(0.85)'
        };

        return transforms[position] || transforms['RightDown'];
    }

    // 獲取顯示時的 transform 樣式
    getShowTransform() {
        const position = this.getAttribute('position') || 'RightDown';
        const transforms = {
            'RightDown': 'translateY(0) scale(1)',
            'LeftDown': 'translateY(0) scale(1)',
            'CenterDown': 'translateX(-50%) translateY(0) scale(1)',
            'Center': 'translate(-50%, -50%) translateY(0) scale(1)'
        };

        return transforms[position] || transforms['RightDown'];
    }

    // 渲染組件
    render() {
        const width = this.getAttribute('width') || '300px';
        const height = this.getAttribute('height') || '300px';
        const positionStyle = this.getPositionStyle();
        const positionTransform = this.getPositionTransform();
        const showTransform = this.getShowTransform();
        
        // 為了兼容 CSS 中的 positionStyles 引用，創建一個模擬的 positionStyles 對象
        const positionStyles = {
            transform: positionTransform
        };
        const closeLabel = escapeHtmlForTooltip(this._t('common.close'));
        const dontShowToday = escapeHtmlForTooltip(this._t('common.dontShowToday'));
        const navPrev = escapeHtmlForTooltip(this._t('card.navPrev'));
        const navNext = escapeHtmlForTooltip(this._t('card.navNext'));

        this.shadowRoot.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                #inf-marketing-square-card-banner {
                    position: fixed;
                    ${positionStyle}
                    width: ${width};
                    height: ${height};
                    border-radius: 8px;
                    overflow: visible;
                    opacity: 0;
                    transform: ${positionTransform};
                    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    user-select: none;
                    touch-action: pan-y pinch-zoom;
                    background-color: #fff;
                }

                #inf-marketing-square-card-banner.show {
                    opacity: 1;
                    transform: ${showTransform};
                }

                .slide-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    cursor: grab;
                }

                .slide-container:active {
                    cursor: grabbing;
                }

                .slide-container.dragging {
                    transition: none;
                }

                .slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }

                .slide.active {
                    opacity: 1;
                }

                .slide img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .image-counter {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    color: #fff;
                    height: 28px;
                    width: 28px;

                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 500;
                    z-index: 10;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .close-button {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background-color: rgba(0,0,0,0.6);
                    border: none;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 10;
                }

                .close-button:hover {
                    background-color: rgba(255, 255, 255, 0.5);
                    color: #333;
                    transform: scale(1.1);
                }

                .nav-button {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(0,0,0,0.6);
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 10;
                    opacity: 0;
                }

                #inf-marketing-square-card-banner:hover .nav-button {
                    opacity: 1;
                }

                .nav-button:hover {
                    background-color: rgba(255, 255, 255, 0.9);
                    color: #333;
                    transform: translateY(-50%) scale(1.1);
                }

                .nav-button.prev {
                    left: 10px;
                }

                .nav-button.next {
                    right: 10px;
                }

                .dont-show-today-container {
                    position: absolute;
                    top: -20px;
                    left: 4px;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }

                .dont-show-today-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    user-select: none;
                }

                .dont-show-today-checkbox {
                    width: 14px;
                    height: 14px;
                    margin: 0;
                    cursor: pointer;
                    accent-color: #1e1e19;
                }

                .dont-show-today-text {
                    color: #333;
                    font-family: "Noto Sans TC";
                    font-size: 11px;
                    font-weight: 400;
                    line-height: 14px;
                    letter-spacing: 0.3px;
                    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
                }

                /* 手機版響應式設計 */
                @media (max-width: 480px) {
                    .dont-show-today-container {
                        top: -16px;
                    }

                    .dont-show-today-text {
                        font-size: 10px;
                        line-height: 12px;
                    }

                    .dont-show-today-checkbox {
                        width: 12px;
                        height: 12px;
                    }
                }

                @media (max-width: 360px) {
                    .dont-show-today-container {
                        margin-top: 5px;
                        padding: 0 6px;
                    }

                    .dont-show-today-text {
                        font-size: 9px;
                        line-height: 11px;
                    }

                    .dont-show-today-checkbox {
                        width: 11px;
                        height: 11px;
                    }
                }

                /* 添加懸浮動畫效果 */
                .popup-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 12px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                    pointer-events: none;
                    animation: popupGlow 6s ease-in-out infinite;
                }

                /* 輕微發光效果 */
                @keyframes popupGlow {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(252, 252, 248, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(252, 252, 248, 0.4);
                    }
                }

                /* 添加連續的輕微浮動效果 */
                @keyframes continuousFloat {
                    0%, 100% {
                        transform: ${positionStyles.transform === 'none' ? 'translateY(0)' : positionStyles.transform + ' translateY(0)'};
                    }
                    50% {
                        transform: ${positionStyles.transform === 'none' ? 'translateY(-2px)' : positionStyles.transform + ' translateY(-2px)'};
                    }
                }

                /* 從右下角進入動畫 */
                @keyframes popupEnterBottomRight {
                    0% {
                        transform: translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* 從左下角進入動畫 */
                @keyframes popupEnterBottomLeft {
                    0% {
                        transform: translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* 從正下方進入動畫 */
                @keyframes popupEnterBottomCenter {
                    0% {
                        transform: translateX(-50%) translateY(120px);
                        opacity: 0;
                    }
                    30% {
                        transform: translateX(-50%) translateY(80px);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translateX(-50%) translateY(-8px);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateX(-50%) translateY(4px);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }

                /* 從正中間進入動畫 */
                @keyframes popupEnterCenter {
                    0% {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                    30% {
                        transform: translate(-50%, -50%) scale(0.9);
                        opacity: 0.3;
                    }
                    60% {
                        transform: translate(-50%, -50%) scale(1.05);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translate(-50%, -50%) scale(0.98);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            </style>
            
            <div id="inf-marketing-square-card-banner">
                ${this.config.todayDisplayMode === true ? `
                <div class="dont-show-today-container">
                    <label class="dont-show-today-label">
                        <input type="checkbox" class="dont-show-today-checkbox" id="dont-show-today">
                        <span class="dont-show-today-text">${dontShowToday}</span>
                    </label>
                </div>
                ` : ''}
                <div class="image-counter">1/1</div>
                <button class="close-button" title="${closeLabel}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
                
                <button class="nav-button prev" title="${navPrev}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
                
                <button class="nav-button next" title="${navNext}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </button>
                
                <div class="slide-container"></div>
            </div>

            <!-- 智慧選物彈窗已移至獨立的 inf-marketing-modal 組件 -->
        `;
    }

    /**
     * 手機版動態調整 modal 高度，確保真正置中
     */
    adjustModalHeightForMobile() {
        const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
        if (!isMobile) return;

        // 取得可視高度（不含網址列）
        const vh = window.innerHeight;
        const modalContent = this.shadowRoot?.querySelector('.modal-content');
        if (modalContent) {
            // 設定最大高度為可視高度的 90%，避免貼邊
            modalContent.style.maxHeight = Math.floor(vh * 0.9) + 'px';
            modalContent.style.height = 'auto';
            modalContent.style.top = '50%';
            modalContent.style.left = '50%';
            modalContent.style.transform = 'translate(-50%, -50%)';
            modalContent.style.position = 'relative';
        }
    }
}

// 註冊Web Component
customElements.define('inf-marketing-square-card-banner', InfMarketingSquareCardBannerComponent);

// inf-marketing-floating-button-component.js
// 封裝浮動按鈕，點擊時開啟/關閉 inf-marketing-modal 彈窗

const FLOATING_GUIDE_STORAGE_KEY = 'inf-marketing-float-guide-dismissed';
const MULTI_ROUTE_REOPEN_ICON = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.25 4.25h9.5M2.25 7h9.5M2.25 9.75h9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const FLOATING_TOOLTIP_LOGO_SRC = 'data:image/png;base64,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';

const FLOATING_BTN_STYLE = `
.ai-pd-container {
  position: relative;
}
.ai-pd-container__anchor {
  z-index: 999;
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 60px;
  height: 60px;
  transition: z-index 0.3s;
}
@media screen and (min-width: 480px) {
  .ai-pd-container__anchor {
    width: 70px;
    height: 70px;
  }
}
.ai-pd-container__anchor--modal-open {
  z-index: 2000000000;
}
.ai-pd-container__anchor--guide-active {
  z-index: 1999999991;
}
.ai-pd-container__guide-mask {
  position: fixed;
  inset: 0;
  z-index: 1999999990;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.ai-pd-container__guide-mask[hidden] {
  display: none !important;
}
.ai-pd-container__guide-card {
  position: absolute;
  bottom: calc(100% + 16px);
  z-index: 3;
  box-sizing: border-box;
  width: max-content;
  max-width: min(280px, calc(100vw - 32px));
  min-width: 200px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  color: #1e1e19;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
}
.ai-pd-container__guide-card[hidden] {
  display: none !important;
}
.ai-pd-container__guide-card--align-end {
  right: 0;
  left: auto;
}
.ai-pd-container__guide-card--align-start {
  left: 0;
  right: auto;
}
.ai-pd-container__guide-card--align-center {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}
.ai-pd-container__guide-card-text {
  margin: 0 0 12px;
}
.ai-pd-container__guide-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.ai-pd-container__guide-btn {
  appearance: none;
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
}
.ai-pd-container__guide-btn--skip {
  background: transparent;
  color: #6b6b63;
}
.ai-pd-container__guide-btn--start {
  background: #1e1e19;
  color: #ffffff;
}
.ai-pd-container__guide-help {
  position: absolute;
  top: -6px;
  left: -6px;
  bottom: auto;
  right: auto;
  z-index: 4;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #1e1e19;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.ai-pd-container__guide-help[hidden],
.ai-pd-container__multi-route-reopen[hidden] {
  display: none !important;
}
/* 引導進行中一律隱藏浮動鈕輔助按鈕，避免與遮罩搶戲 */
.ai-pd-container__anchor--guide-active .ai-pd-container__guide-help,
.ai-pd-container__anchor--guide-active .ai-pd-container__multi-route-reopen {
  display: none !important;
}
.ai-pd-container__trigger-wrap {
  position: relative;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
}
@media screen and (min-width: 480px) {
  .ai-pd-container__trigger-wrap {
    width: 70px;
    height: 70px;
  }
}
.ai-pd-container__multi-route-reopen {
  position: absolute;
  top: -6px;
  left: -6px;
  right: auto;
  z-index: 5;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #1e1e19;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.ai-pd-container__multi-route-reopen svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.ai-pd-container__anchor--align-end .ai-pd-container__multi-route-reopen,
.ai-pd-container__anchor--align-end .ai-pd-container__guide-help {
  left: auto;
  right: -6px;
}
.ai-pd-container__trigger--guide-spotlight {
  box-shadow:
    0 0 0 3px #ffffff,
    0 0 0 6px rgba(255, 255, 255, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.28);
}
.ai-pd-container__tooltip-stack--guide-spotlight {
  position: relative;
  z-index: 2;
  border-radius: 22px;
  box-shadow:
    0 0 0 3px #ffffff,
    0 0 0 6px rgba(255, 255, 255, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.28);
}
.ai-pd-container__tooltip-panel--guide-active {
  position: relative;
  z-index: 2;
  animation: ai-pd-panel-guide-pulse 2.2s ease-in-out infinite;
}
.ai-pd-container__trigger--guide-secondary-spotlight {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 5px rgba(255, 255, 255, 0.28),
    0 8px 24px rgba(0, 0, 0, 0.22);
}
@keyframes ai-pd-panel-guide-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 3px #ffffff,
      0 0 0 7px rgba(255, 255, 255, 0.38),
      0 16px 40px rgba(0, 0, 0, 0.18);
  }
  50% {
    box-shadow:
      0 0 0 3px #ffffff,
      0 0 0 11px rgba(255, 255, 255, 0.22),
      0 20px 48px rgba(0, 0, 0, 0.24);
  }
}
.ai-pd-container__multi-route-guide-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.ai-pd-container__multi-route-guide-footer[hidden] {
  display: none !important;
}
.ai-pd-container__multi-route-guide-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(60, 60, 67, 0.62);
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang TC', 'Noto Sans TC', sans-serif;
}
.ai-pd-container__multi-route-guide-skip {
  appearance: none;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  background: rgba(120, 120, 128, 0.1);
  color: rgba(60, 60, 67, 0.72);
  font-size: 13px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.ai-pd-container__multi-route-guide-skip:hover,
.ai-pd-container__multi-route-guide-skip:focus-visible {
  background: rgba(120, 120, 128, 0.16);
  color: rgba(60, 60, 67, 0.9);
  outline: none;
}
.ai-pd-container__guide-card--multi-route {
  z-index: 4;
}
.ai-pd-container__guide-card-actions--multi-route {
  justify-content: flex-end;
}

.ai-pd-container__tooltip-wrap {
  position: absolute;
  bottom: calc(100% + 16px);
  z-index: 2;
  width: auto;
  max-width: min(300px, calc(100vw - 32px));
  min-width: 260px;
  padding-top: 15px;
  animation: ai-pd-tooltip-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.ai-pd-container__tooltip-wrap--align-center {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  animation-name: ai-pd-tooltip-in-center;
}
.ai-pd-container__tooltip-wrap--align-start {
  left: 0;
  right: auto;
  transform: none;
}
.ai-pd-container__tooltip-wrap--align-end {
  left: auto;
  right: 0;
  transform: none;
}
.ai-pd-container__tooltip-wrap[hidden] {
  display: none !important;
  animation: none;
}
.ai-pd-container__tooltip {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  padding: 12px 36px 12px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 12px 28px rgba(0, 0, 0, 0.08);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.ai-pd-container__tooltip:hover {
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.06),
    0 14px 32px rgba(0, 0, 0, 0.1);
}
.ai-pd-container__tooltip-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}
.ai-pd-container__tooltip-badge-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}
.ai-pd-container__tooltip-close {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(60, 60, 67, 0.36);
  font-size: 17px;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.ai-pd-container__tooltip-close:hover,
.ai-pd-container__tooltip-close:focus-visible {
  color: rgba(60, 60, 67, 0.72);
  background: rgba(120, 120, 128, 0.12);
  outline: none;
}
.ai-pd-container__tooltip-typewriter {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.35;
  text-align: center;
}
.ai-pd-container__tooltip-text {
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.35;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'PingFang TC', 'Noto Sans TC', sans-serif;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
  display: block;
  transform: translateY(0.5px);
}
.ai-pd-container__tooltip-text::after {
  content: '';
  display: inline-block;
  width: 1.5px;
  height: 0.95em;
  margin-left: 2px;
  vertical-align: -0.08em;
  background: #1d1d1f;
  border-radius: 1px;
  animation: ai-pd-tooltip-caret 0.9s steps(1) infinite;
}
.ai-pd-container__tooltip-text--done {
  white-space: normal;
}
.ai-pd-container__tooltip-text--done::after {
  content: none;
  display: none;
  animation: none;
}
.ai-pd-container__tooltip-wrap--multi {
  max-width: min(320px, calc(100vw - 32px));
  min-width: 260px;
  padding-top: 18px;
}
.ai-pd-container__tooltip-wrap--multi .ai-pd-container__tooltip-badge {
  top: 0;
  left: 50%;
  z-index: 6;
  transform: translate(-50%, -42%);
}
.ai-pd-container__tooltip-wrap--multi.ai-pd-container__tooltip-wrap--guide-badge-up .ai-pd-container__tooltip-badge {
  z-index: 7;
}
.ai-pd-container__tooltip-panel {
  box-sizing: border-box;
  width: 100%;
  padding: 16px 14px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.97);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.12);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
}
.ai-pd-container__tooltip-panel-header {
  position: relative;
  padding-right: 12px;
}
.ai-pd-container__tooltip-panel .ai-pd-container__tooltip-close {
  top: 0;
  right: 0;
  transform: none;
}
.ai-pd-container__tooltip-panel-title {
  margin: 0;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.5;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'PingFang TC', 'Noto Sans TC', sans-serif;
}
.ai-pd-container__route-section {
  margin-top: 12px;
}
.ai-pd-container__route-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(60, 60, 67, 0.72);
  text-transform: none;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang TC', 'Noto Sans TC', sans-serif;
}
.ai-pd-container__route-section-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #007aff;
  flex-shrink: 0;
}
.ai-pd-container__route-section-label[hidden] {
  display: none !important;
}
.ai-pd-container__route-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ai-pd-container__route-card {
  appearance: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.ai-pd-container__route-card:hover,
.ai-pd-container__route-card:focus-visible {
  background: #1e1e19;
  border-color: #1e1e19;
  outline: none;
}
.ai-pd-container__route-card:active {
  transform: scale(0.98);
}
.ai-pd-container__route-card--selected {
  background: #1e1e19;
  border-color: #1e1e19;
}
.ai-pd-container__route-card--selected .ai-pd-container__route-card-text,
.ai-pd-container__route-card--selected .ai-pd-container__route-card-arrow {
  color: #ffffff;
}
.ai-pd-container__tooltip-panel--guide-active .ai-pd-container__tooltip-close {
  display: none !important;
}
.ai-pd-container__tooltip-panel--guide-active .ai-pd-container__route-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.ai-pd-container__tooltip-panel--guide-active .ai-pd-container__route-card--selected {
  background: #1e1e19;
  border-color: #1e1e19;
  box-shadow: none;
}
.ai-pd-container__tooltip-panel--guide-active .ai-pd-container__route-card:hover,
.ai-pd-container__tooltip-panel--guide-active .ai-pd-container__route-card:focus-visible {
  background: #1e1e19;
  border-color: #1e1e19;
  box-shadow: none;
}
.ai-pd-container__route-card-text {
  flex: 1;
  min-width: 0;
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.35;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'PingFang TC', 'Noto Sans TC', sans-serif;
  transition: color 0.2s ease;
}
.ai-pd-container__route-card:hover .ai-pd-container__route-card-text,
.ai-pd-container__route-card:focus-visible .ai-pd-container__route-card-text {
  color: #ffffff;
}
.ai-pd-container__route-card-arrow {
  flex-shrink: 0;
  color: rgba(60, 60, 67, 0.45);
  font-size: 18px;
  line-height: 1;
  font-weight: 400;
  transition: color 0.2s ease;
}
.ai-pd-container__route-card:hover .ai-pd-container__route-card-arrow,
.ai-pd-container__route-card:focus-visible .ai-pd-container__route-card-arrow {
  color: #ffffff;
}
@media (prefers-reduced-motion: reduce) {
  .ai-pd-container__tooltip-panel--guide-active {
    animation: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ai-pd-container__tooltip-wrap {
    animation: none;
  }
  .ai-pd-container__tooltip-text::after {
    animation: none;
    opacity: 0;
  }
}
@keyframes ai-pd-tooltip-caret {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}
@keyframes ai-pd-tooltip-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes ai-pd-tooltip-in-center {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
.ai-pd-container__trigger {
  z-index: 1;
  position: relative;
  display: flex;
  box-sizing: border-box;
  padding: 14px;
  justify-content: center;
  margin: 0;
  align-items: center;
  flex-shrink: 0;
  border-radius: 21px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0px 0.5px 5px 0px rgba(0, 0, 0, 0.14), 0px 0px 20px 0px rgba(0, 0, 0, 0.15);
  width: 60px;
  height: 60px;
  border: none;
  transition: box-shadow 0.3s;
}
.ai-pd-container__trigger:hover, .ai-pd-container__trigger:active {
  cursor: pointer;
  box-shadow: 0px 2px 12px 0px rgba(0,0,0,0.18);
}
@media screen and (min-width: 480px) {
  .ai-pd-container .ai-pd-container__trigger {
    width: 70px;
    height: 70px;
    padding: 15px;
    border-radius: 25px;
    -webkit-border-radius: 25px;
    -moz-border-radius: 25px;
    -ms-border-radius: 25px;
    -o-border-radius: 25px;
    box-shadow: 0px 0.5px 5px 0px rgba(0, 0, 0, 0.18), 0px 0px 20px 0px rgba(0, 0, 0, 0.15);
    -webkit-backdrop-filter: blur(40px);
    backdrop-filter: blur(40px);
    --webkit-backdrop-filter: blur(40px);
  }
}
.ai-pd-container .ai-pd-container__trigger .ai-pd-container__icon {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  transition: opacity 0.3s ease-out;
  -webkit-transition: opacity 0.3s ease-out;
  -moz-transition: opacity 0.3s ease-out;
  -ms-transition: opacity 0.3s ease-out;
  -o-transition: opacity 0.3s ease-out;
}
.ai-pd-container .ai-pd-container__trigger .ai-pd-container__icon--alert {
  display: none;
}

/* 搜尋狀態的 hover 效果 */
.ai-pd-container .ai-pd-container__trigger--search:not(.ai-pd-container__trigger--result):hover .ai-pd-container__icon, 
.ai-pd-container .ai-pd-container__trigger--search:not(.ai-pd-container__trigger--result):active .ai-pd-container__icon {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%3E%3Cg%20clip-path%3D%22url(%23clip0_3305_2871)%22%3E%3Cpath%20d%3D%22M5.24895%2019.1485C7.59554%2025.3933%2014.5602%2028.5533%2020.8049%2026.2067C27.0496%2023.8602%2030.2097%2016.8955%2027.8631%2010.6508C25.5165%204.40604%2018.5519%201.24597%2012.3072%203.59256C6.06243%205.93914%202.90236%2012.9038%205.24895%2019.1485Z%22%20fill%3D%22url(%23paint0_linear_3305_2871)%22%2F%3E%3Cpath%20d%3D%22M16.956%2030.812C25.285%2030.812%2032.037%2024.06%2032.037%2015.731C32.037%207.40202%2025.285%200.650024%2016.956%200.650024C8.627%200.650024%201.875%207.40202%201.875%2015.731C1.875%2024.06%208.627%2030.812%2016.956%2030.812ZM27.787%2015.731C27.787%2021.7128%2022.9378%2026.562%2016.956%2026.562C10.9742%2026.562%206.125%2021.7128%206.125%2015.731C6.125%209.74923%2010.9742%204.90002%2016.956%204.90002C22.9378%204.90002%2027.787%209.74923%2027.787%2015.731Z%22%20fill%3D%22%231E1E19%22%20stroke%3D%22%231E1E19%22%20stroke-width%3D%220.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M24.0633%2025.2728C24.8444%2024.4917%2026.1107%2024.4917%2026.8918%2025.2728L33.511%2031.8921C34.2921%2032.6731%2034.2921%2033.9394%2033.511%2034.7205C32.73%2035.5015%2031.4636%2035.5015%2030.6826%2034.7205L24.0633%2028.1012C23.2823%2027.3202%2023.2823%2026.0538%2024.0633%2025.2728Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.3034%2016.6005H22.0534C22.0534%2014.9978%2023.3527%2013.6985%2024.9554%2013.6985V12.9485V12.1985C23.3527%2012.1985%2022.0534%2010.8992%2022.0534%209.29651H21.3034H20.5534C20.5534%2010.8992%2019.2541%2012.1985%2017.6514%2012.1985V12.9485V13.6985C19.2541%2013.6985%2020.5534%2014.9978%2020.5534%2016.6005H21.3034Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Crect%20x%3D%2225.978%22%20y%3D%2231.7047%22%20width%3D%226.33129%22%20height%3D%2210.7663%22%20rx%3D%223%22%20transform%3D%22rotate(-45%2025.978%2031.7047)%22%20fill%3D%22%231E1E19%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear_3305_2871%22%20x1%3D%2212.3072%22%20y1%3D%223.59256%22%20x2%3D%2220.1721%22%20y2%3D%2224.5227%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23F9FE9F%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23CBE2E2%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0_3305_2871%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E");
}

/* 結果狀態的 hover 效果 */
.ai-pd-container .ai-pd-container__trigger--result:not(.ai-pd-container__trigger--close):hover .ai-pd-container__icon, 
.ai-pd-container .ai-pd-container__trigger--result:not(.ai-pd-container__trigger--close):active .ai-pd-container__icon {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%3E%3Cg%20clip-path%3D%22url(%23clip0_3305_2871)%22%3E%3Cpath%20d%3D%22M5.24895%2019.1485C7.59554%2025.3933%2014.5602%2028.5533%2020.8049%2026.2067C27.0496%2023.8602%2030.2097%2016.8955%2027.8631%2010.6508C25.5165%204.40604%2018.5519%201.24597%2012.3072%203.59256C6.06243%205.93914%202.90236%2012.9038%205.24895%2019.1485Z%22%20fill%3D%22url(%23paint0_linear_3305_2871)%22%2F%3E%3Cpath%20d%3D%22M16.956%2030.812C25.285%2030.812%2032.037%2024.06%2032.037%2015.731C32.037%207.40202%2025.285%200.650024%2016.956%200.650024C8.627%200.650024%201.875%207.40202%201.875%2015.731C1.875%2024.06%208.627%2030.812%2016.956%2030.812ZM27.787%2015.731C27.787%2021.7128%2022.9378%2026.562%2016.956%2026.562C10.9742%2026.562%206.125%2021.7128%206.125%2015.731C6.125%209.74923%2010.9742%204.90002%2016.956%204.90002C22.9378%204.90002%2027.787%209.74923%2027.787%2015.731Z%22%20fill%3D%22%231E1E19%22%20stroke%3D%22%231E1E19%22%20stroke-width%3D%220.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M24.0633%2025.2728C24.8444%2024.4917%2026.1107%2024.4917%2026.8918%2025.2728L33.511%2031.8921C34.2921%2032.6731%2034.2921%2033.9394%2033.511%2034.7205C32.73%2035.5015%2031.4636%2035.5015%2030.6826%2034.7205L24.0633%2028.1012C23.2823%2027.3202%2023.2823%2026.0538%2024.0633%2025.2728Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.3034%2016.6005H22.0534C22.0534%2014.9978%2023.3527%2013.6985%2024.9554%2013.6985V12.9485V12.1985C23.3527%2012.1985%2022.0534%2010.8992%2022.0534%209.29651H21.3034H20.5534C20.5534%2010.8992%2019.2541%2012.1985%2017.6514%2012.1985V12.9485V13.6985C19.2541%2013.6985%2020.5534%2014.9978%2020.5534%2016.6005H21.3034Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Crect%20x%3D%2225.978%22%20y%3D%2231.7047%22%20width%3D%226.33129%22%20height%3D%2210.7663%22%20rx%3D%223%22%20transform%3D%22rotate(-45%2025.978%2031.7047)%22%20fill%3D%22%231E1E19%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear_3305_2871%22%20x1%3D%2212.3072%22%20y1%3D%223.59256%22%20x2%3D%2220.1721%22%20y2%3D%2224.5227%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23F9FE9F%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23CBE2E2%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0_3305_2871%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E");
}

/* 搜尋狀態的預設圖標 */
.ai-pd-container .ai-pd-container__trigger--search:not(.ai-pd-container__trigger--result) .ai-pd-container__icon {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M24.0633%2025.2728C24.8444%2024.4917%2026.1107%2024.4917%2026.8918%2025.2728L33.511%2031.8921C34.2921%2032.6731%2034.2921%2033.9394%2033.511%2034.7205C32.73%2035.5015%2031.4636%2035.5015%2030.6826%2034.7205L24.0633%2028.1012C23.2823%2027.3202%2023.2823%2026.0538%2024.0633%2025.2728Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Crect%20x%3D%2225.978%22%20y%3D%2231.7047%22%20width%3D%226.33129%22%20height%3D%2210.7663%22%20rx%3D%223%22%20transform%3D%22rotate(-45%2025.978%2031.7047)%22%20fill%3D%22%231E1E19%22%2F%3E%3Cg%20filter%3D%22url(%23filter0_b_3305_3475)%22%3E%3Cellipse%20cx%3D%2216.9998%22%20cy%3D%2215.8828%22%20rx%3D%2213.3714%22%20ry%3D%2213.3714%22%20fill%3D%22%23FCFCF8%22%20fill-opacity%3D%220.3%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M16.956%2030.812C25.285%2030.812%2032.037%2024.06%2032.037%2015.731C32.037%207.40202%2025.285%200.650024%2016.956%200.650024C8.627%200.650024%201.875%207.40202%201.875%2015.731C1.875%2024.06%208.627%2030.812%2016.956%2030.812ZM27.787%2015.731C27.787%2021.7128%2022.9378%2026.562%2016.956%2026.562C10.9742%2026.562%206.125%2021.7128%206.125%2015.731C6.125%209.74923%2010.9742%204.90002%2016.956%204.90002C22.9378%204.90002%2027.787%209.74923%2027.787%2015.731Z%22%20fill%3D%22%233C3C39%22%20stroke%3D%22%233C3C39%22%20stroke-width%3D%220.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.3034%2016.6005H22.0534C22.0534%2014.9978%2023.3527%2013.6985%2024.9554%2013.6985V12.9485V12.1985C23.3527%2012.1985%2022.0534%2010.8992%2022.0534%209.29651H21.3034H20.5534C20.5534%2010.8992%2019.2541%2012.1985%2017.6514%2012.1985V12.9485V13.6985C19.2541%2013.6985%2020.5534%2014.9978%2020.5534%2016.6005H21.3034Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Cdefs%3E%3Cfilter%20id%3D%22filter0_b_3305_3475%22%20x%3D%22-28.3716%22%20y%3D%22-29.4886%22%20width%3D%2290.7427%22%20height%3D%2290.7429%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeGaussianBlur%20in%3D%22BackgroundImageFix%22%20stdDeviation%3D%2216%22%2F%3E%3CfeComposite%20in2%3D%22SourceAlpha%22%20operator%3D%22in%22%20result%3D%22effect1_backgroundBlur_3305_3475%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_backgroundBlur_3305_3475%22%20result%3D%22shape%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3C%2Fsvg%3E");
}

/* 結果狀態的圖標 */
.ai-pd-container .ai-pd-container__trigger--result:not(.ai-pd-container__trigger--search) .ai-pd-container__icon {
   background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%3E%3Cg%20clip-path%3D%22url(%23clip0_3305_2871)%22%3E%3Cpath%20d%3D%22M5.24895%2019.1485C7.59554%2025.3933%2014.5602%2028.5533%2020.8049%2026.2067C27.0496%2023.8602%2030.2097%2016.8955%2027.8631%2010.6508C25.5165%204.40604%2018.5519%201.24597%2012.3072%203.59256C6.06243%205.93914%202.90236%2012.9038%205.24895%2019.1485Z%22%20fill%3D%22url(%23paint0_linear_3305_2871)%22%2F%3E%3Cpath%20d%3D%22M16.956%2030.812C25.285%2030.812%2032.037%2024.06%2032.037%2015.731C32.037%207.40202%2025.285%200.650024%2016.956%200.650024C8.627%200.650024%201.875%207.40202%201.875%2015.731C1.875%2024.06%208.627%2030.812%2016.956%2030.812ZM27.787%2015.731C27.787%2021.7128%2022.9378%2026.562%2016.956%2026.562C10.9742%2026.562%206.125%2021.7128%206.125%2015.731C6.125%209.74923%2010.9742%204.90002%2016.956%204.90002C22.9378%204.90002%2027.787%209.74923%2027.787%2015.731Z%22%20fill%3D%22%231E1E19%22%20stroke%3D%22%231E1E19%22%20stroke-width%3D%220.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M24.0633%2025.2728C24.8444%2024.4917%2026.1107%2024.4917%2026.8918%2025.2728L33.511%2031.8921C34.2921%2032.6731%2034.2921%2033.9394%2033.511%2034.7205C32.73%2035.5015%2031.4636%2035.5015%2030.6826%2034.7205L24.0633%2028.1012C23.2823%2027.3202%2023.2823%2026.0538%2024.0633%2025.2728Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.3034%2016.6005H22.0534C22.0534%2014.9978%2023.3527%2013.6985%2024.9554%2013.6985V12.9485V12.1985C23.3527%2012.1985%2022.0534%2010.8992%2022.0534%209.29651H21.3034H20.5534C20.5534%2010.8992%2019.2541%2012.1985%2017.6514%2012.1985V12.9485V13.6985C19.2541%2013.6985%2020.5534%2014.9978%2020.5534%2016.6005H21.3034Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Crect%20x%3D%2225.978%22%20y%3D%2231.7047%22%20width%3D%226.33129%22%20height%3D%2210.7663%22%20rx%3D%223%22%20transform%3D%22rotate(-45%2025.978%2031.7047)%22%20fill%3D%22%231E1E19%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear_3305_2871%22%20x1%3D%2212.3072%22%20y1%3D%223.59256%22%20x2%3D%2220.1721%22%20y2%3D%2224.5227%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23F9FE9F%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23CBE2E2%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0_3305_2871%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E");
}

/* 結果狀態且非關閉狀態的圖標 */
.ai-pd-container .ai-pd-container__trigger--result:not(.ai-pd-container__trigger--close) .ai-pd-container__icon {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M24.0633%2025.2728C24.8444%2024.4917%2026.1107%2024.4917%2026.8918%2025.2728L33.511%2031.8921C34.2921%2032.6731%2034.2921%2033.9394%2033.511%2034.7205C32.73%2035.5015%2031.4636%2035.5015%2030.6826%2034.7205L24.0633%2028.1012C23.2823%2027.3202%2023.2823%2026.0538%2024.0633%2025.2728Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Crect%20x%3D%2225.978%22%20y%3D%2231.7047%22%20width%3D%226.33129%22%20height%3D%2210.7663%22%20rx%3D%223%22%20transform%3D%22rotate(-45%2025.978%2031.7047)%22%20fill%3D%22%231E1E19%22%2F%3E%3Cg%20filter%3D%22url(%23filter0_b_3305_3475)%22%3E%3Cellipse%20cx%3D%2216.9998%22%20cy%3D%2215.8828%22%20rx%3D%2213.3714%22%20ry%3D%2213.3714%22%20fill%3D%22%23FCFCF8%22%20fill-opacity%3D%220.3%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M16.956%2030.812C25.285%2030.812%2032.037%2024.06%2032.037%2015.731C32.037%207.40202%2025.285%200.650024%2016.956%200.650024C8.627%200.650024%201.875%207.40202%201.875%2015.731C1.875%2024.06%208.627%2030.812%2016.956%2030.812ZM27.787%2015.731C27.787%2021.7128%2022.9378%2026.562%2016.956%2026.562C10.9742%2026.562%206.125%2021.7128%206.125%2015.731C6.125%209.74923%2010.9742%204.90002%2016.956%204.90002C22.9378%204.90002%2027.787%209.74923%2027.787%2015.731Z%22%20fill%3D%22%233C3C39%22%20stroke%3D%22%233C3C39%22%20stroke-width%3D%220.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.3034%2016.6005H22.0534C22.0534%2014.9978%2023.3527%2013.6985%2024.9554%2013.6985V12.9485V12.1985C23.3527%2012.1985%2022.0534%2010.8992%2022.0534%209.29651H21.3034H20.5534C20.5534%2010.8992%2019.2541%2012.1985%2017.6514%2012.1985V12.9485V13.6985C19.2541%2013.6985%2020.5534%2014.9978%2020.5534%2016.6005H21.3034Z%22%20fill%3D%22%231E1E19%22%2F%3E%3Cdefs%3E%3Cfilter%20id%3D%22filter0_b_3305_3475%22%20x%3D%22-28.3716%22%20y%3D%22-29.4886%22%20width%3D%2290.7427%22%20height%3D%2290.7429%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeGaussianBlur%20in%3D%22BackgroundImageFix%22%20stdDeviation%3D%2216%22%2F%3E%3CfeComposite%20in2%3D%22SourceAlpha%22%20operator%3D%22in%22%20result%3D%22effect1_backgroundBlur_3305_3475%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_backgroundBlur_3305_3475%22%20result%3D%22shape%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3C%2Fsvg%3E");
}

.ai-pd-container .ai-pd-container__trigger--result .ai-pd-container__icon--alert {
  display: block;
  position: absolute;
  width: 16px;
  height: 16px;
  top: -2px;
  right: -2px;
}
@media screen and (min-width: 480px) {
  .ai-pd-container .ai-pd-container__trigger--result .ai-pd-container__icon--alert {
    width: 20px;
    height: 20px;
  }
}
.ai-pd-container .ai-pd-container__trigger--close:not(.ai-pd-container__trigger--result) {
  background: rgba(255, 255, 255, 0.85);
  padding: 16px;
}
@media screen and (min-width: 480px) {
  .ai-pd-container .ai-pd-container__trigger--close:not(.ai-pd-container__trigger--result) {
    padding: 21px;
  }
}
.ai-pd-container .ai-pd-container__trigger--close:not(.ai-pd-container__trigger--result):hover .ai-pd-container__icon, .ai-pd-container .ai-pd-container__trigger--close:not(.ai-pd-container__trigger--result):active .ai-pd-container__icon {
  opacity: 1;
}
.ai-pd-container .ai-pd-container__trigger--close:not(.ai-pd-container__trigger--result) .ai-pd-container__icon {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cg opacity='0.5'%3e%3cpath d='M15 5L5 15' stroke='%233B3B32' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3e%3cpath d='M5 5L15 15' stroke='%233B3B32' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/g%3e%3c/svg%3e ");
  opacity: 0.5;
}
`;

class InfMarketingFloatButtonComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._modal = null;
    this._onButtonClick = this._onButtonClick.bind(this);
    this._onTooltipCloseClick = this._onTooltipCloseClick.bind(this);
    this._onTooltipClick = this._onTooltipClick.bind(this);
    this._onTooltipKeyDown = this._onTooltipKeyDown.bind(this);
    this._onGuideStartClick = this._onGuideStartClick.bind(this);
    this._onGuideSkipClick = this._onGuideSkipClick.bind(this);
    this._onGuideHelpClick = this._onGuideHelpClick.bind(this);
    this._onMultiRouteReopenClick = this._onMultiRouteReopenClick.bind(this);
    this._onRouteCardClick = this._onRouteCardClick.bind(this);
    this._isModalOpen = false; // 追蹤彈窗狀態
    this._hasResult = false; // 追蹤是否有搜尋結果
    this._hasTrackedFloatLoad = false; // 頁面首次載入漂浮鈕是否已送 GA
    this._tooltipDismissed = false; // 本次瀏覽是否已關閉打字機對話框
    this._typewriterTimer = null; // 打字機計時器
    this._typewriterCompleted = false; // 打字機是否已跑完一次
    this._guideActive = false; // 遮罩引導是否進行中
    this._guideStep = 'float-button'; // 'multi-route' | 'float-button'
    this._iframeIntroActive = false; // iframe 內引導是否進行中（進行中隱藏「?」）
    this.config = {
      TimeValid: null // 時間有效性驗證
    };
  }

  static get observedAttributes() {
    return ['position', 'time-valid', 'float-tooltip-text', 'enable-guide', 'show-float-guide', 'enable-multi-route', 'multi-route-list', 'multi-route-selected', 'ui-lang'];
  }

  _getUiLang() {
    return getParentUiLang(this.getAttribute('ui-lang'));
  }

  _t(key, replacements) {
    return parentUiT(this._getUiLang(), key, replacements);
  }

  _getTooltipAriaLabel(text) {
    if (!text) return this._t('float.openSmartSelection');
    return this._t('float.openSmartSelectionWith', { text: text });
  }

  _getRouteCardLabel(item) {
    if (item && item.isAiRoute) return this._t('float.aiRouteLabel');
    return (item && (item.label || item.route)) || '';
  }

  // 未設屬性 → 預設文案；空字串 → 不顯示對話框；其餘 → 自訂文案
  _getTooltipText() {
    if (!this.hasAttribute('float-tooltip-text')) {
      return this._t('float.tooltip');
    }
    return this.getAttribute('float-tooltip-text') || '';
  }

  _isTooltipDisabledByText() {
    return this.hasAttribute('float-tooltip-text') && !this.getAttribute('float-tooltip-text');
  }

  _isMultiRouteEnabled() {
    return this.getAttribute('enable-multi-route') === 'true';
  }

  _getMultiRouteList() {
    if (!this.hasAttribute('multi-route-list')) return [];
    try {
      const parsed = JSON.parse(this.getAttribute('multi-route-list'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  _getMultiRouteSelectedId() {
    return (this.getAttribute('multi-route-selected') || '').trim();
  }

  _shouldUseMultiRouteTooltip() {
    return this._isMultiRouteEnabled() && this._getMultiRouteList().length > 0;
  }

  _syncMultiRouteSelectedUi() {
    if (!this.shadowRoot) return;
    const selectedId = this._getMultiRouteSelectedId();
    this.shadowRoot.querySelectorAll('.ai-pd-container__route-card').forEach((card) => {
      const isSelected = selectedId && card.getAttribute('data-route-id') === selectedId;
      card.classList.toggle('ai-pd-container__route-card--selected', isSelected);
      if (isSelected) {
        card.setAttribute('aria-current', 'true');
      } else {
        card.removeAttribute('aria-current');
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'position') {
      this.updatePosition();
      } else if (name === 'float-tooltip-text') {
        this._typewriterCompleted = false;
        if (this.shadowRoot && this.shadowRoot.querySelector('.ai-pd-container')) {
          const tooltip = this.shadowRoot.querySelector('.ai-pd-container__tooltip');
          const text = this._getTooltipText();
          if (tooltip) {
            tooltip.setAttribute('aria-label', this._getTooltipAriaLabel(text));
          }
          this._syncTooltipVisibility();
        }
      } else if (name === 'ui-lang') {
        if (this.shadowRoot && this.shadowRoot.querySelector('.ai-pd-container')) {
          this._typewriterCompleted = false;
          this.removeEventListeners();
          this.render();
          this.setupEventListeners();
          this._syncTooltipVisibility();
          this._updateButtonState();
          if (this._guideActive) {
            this._updateGuideCardForStep();
          }
        }
      } else if (name === 'enable-guide' || name === 'show-float-guide') {
        if (this.shadowRoot && this.shadowRoot.querySelector('.ai-pd-container')) {
          this._initFloatGuide();
        }
      } else if (name === 'enable-multi-route' || name === 'multi-route-list') {
        if (this.shadowRoot && this.shadowRoot.querySelector('.ai-pd-container')) {
          this.removeEventListeners();
          this.render();
          this.setupEventListeners();
          this._syncTooltipVisibility();
        }
      } else if (name === 'multi-route-selected') {
        this._syncMultiRouteSelectedUi();
      } else if (name === 'time-valid') {
        if (newValue) {
          try {
            // 嘗試解析為 JSON（陣列格式）
            this.config.TimeValid = JSON.parse(newValue);
          } catch (e) {
            // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
            this.config.TimeValid = newValue;
          }
        } else {
          this.config.TimeValid = null;
        }
        
        // 檢查時間有效性
        if (!this.isValidTimeRange()) {
          // 如果不在有效時間範圍內，隱藏組件
          this.style.display = 'none';
          return;
        } else {
          // 如果在有效時間範圍內，顯示組件
          this.style.display = 'block';
        }
      }
    }
  }

  connectedCallback() {
    // 讀取 TimeValid 屬性
    const timeValidAttr = this.getAttribute('time-valid');
    if (timeValidAttr) {
      try {
        // 嘗試解析為 JSON（陣列格式）
        this.config.TimeValid = JSON.parse(timeValidAttr);
      } catch (e) {
        // 如果不是 JSON 格式，直接使用字串（如 "2025-07-23~2025-08-01"）
        this.config.TimeValid = timeValidAttr;
      }
    }
    
    // 檢查時間有效性
    if (!this.isValidTimeRange()) {
      return; // 如果不在有效時間範圍內，則不渲染組件
    }

    this._tooltipDismissed = false;
    
    this.render();
    this.setupEventListeners();
    
    // 自動插入 modal 組件（如不存在）
    if (!document.querySelector('inf-marketing-modal')) {
      const modal = document.createElement('inf-marketing-modal');
      modal.setAttribute('id', 'infMarketingModal');
      if (this.getAttribute('ui-lang')) {
        modal.setAttribute('ui-lang', this.getAttribute('ui-lang'));
      }
      document.body.appendChild(modal);
    }
    this._modal = document.querySelector('inf-marketing-modal');
    
    // 監聽彈窗狀態變化
    this._setupModalListeners();
    
    // 監聽 iframe 消息
    this._setupIframeMessageListener();
    this._syncTooltipVisibility();
    this._initFloatGuide();
  }

  /**
   * 檢查時間有效性
   * @returns {boolean} 是否在有效時間範圍內
   */
  isValidTimeRange() {
    if (!this.config.TimeValid) {
      return true; // 如果沒有設定時間限制，則視為有效
    }

    let startDate, endDate;

    // 處理字串格式 "2025-07-23~2025-08-01"
    if (typeof this.config.TimeValid === 'string') {
      const parts = this.config.TimeValid.split('~');
      if (parts.length === 2) {
        startDate = new Date(parts[0]);
        endDate = new Date(parts[1]);
      } else {
        return true; // 格式不正確，視為有效
      }
    }
    // 處理陣列格式 ["2025-07-23", "2025-08-01"]
    else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
      startDate = new Date(this.config.TimeValid[0]);
      endDate = new Date(this.config.TimeValid[1]);
    }
    else {
      return true; // 格式不正確，視為有效
    }

    // 檢查日期是否有效
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('TimeValid 日期格式無效:', this.config.TimeValid);
      return true; // 日期無效，視為有效
    }

    // 只比較日期部分，不考慮時間
    const now = new Date();
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return nowDate >= startDateOnly && nowDate <= endDateOnly;
  }

  disconnectedCallback() {
    this._stopTypewriter();
    this.removeEventListeners();
    this._removeIframeMessageListener();
  }

  // 設置彈窗狀態監聽器
  _setupModalListeners() {
    if (!this._modal) return;
    
    // 監聽彈窗顯示事件
    this._modal.addEventListener('inf-marketing-modal:show', () => {
      this._isModalOpen = true;
      this._updateButtonState();
    });
    
    // 監聽彈窗隱藏事件
    this._modal.addEventListener('inf-marketing-modal:hide', () => {
      this._isModalOpen = false;
      this._iframeIntroActive = false;
      this._updateButtonState();
      this._syncGuideHelpVisibility();
      // modal 關閉後恢復 float_tooltip（若尚未手動關閉且已設定文案）
      this._syncTooltipVisibility();
    });
  }

  // 更新按鈕狀態
  _updateButtonState() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    if (!trigger) return;
    
    if (this._isModalOpen) {
      // 彈窗開啟時，切換到關閉狀態
      trigger.classList.remove('ai-pd-container__trigger--search');
      trigger.classList.remove('ai-pd-container__trigger--result');
      trigger.classList.add('ai-pd-container__trigger--close');
      trigger.title = this._t('float.closeSmartSelection');
      // 添加 modal-open 類別，z-index 設為 2000000000
      if (anchor) {
        anchor.classList.add('ai-pd-container__anchor--modal-open');
      }
    } else {
      // 彈窗關閉時，檢查是否有結果狀態需要恢復
      trigger.classList.remove('ai-pd-container__trigger--close');
      // 移除 modal-open 類別，z-index 回到 999
      if (anchor) {
        anchor.classList.remove('ai-pd-container__anchor--modal-open');
      }
      
      // 如果有結果狀態的記憶，恢復到結果狀態
      if (this._hasResult) {
        trigger.classList.remove('ai-pd-container__trigger--search');
        trigger.classList.add('ai-pd-container__trigger--result');
        trigger.title = this._t('float.viewResults');
      } else {
        // 否則恢復到搜尋狀態
        trigger.classList.remove('ai-pd-container__trigger--result');
        trigger.classList.add('ai-pd-container__trigger--search');
        trigger.title = this._t('float.openSmartSelection');
      }
    }
    this._syncTooltipVisibility();
  }

  // 關閉打字機對話框（當前頁面實例不再顯示）
  _dismissTooltip() {
    if (this._guideActive && this._isMultiRouteGuideStep()) {
      return;
    }
    this._tooltipDismissed = true;
    this._syncTooltipVisibility();
  }

  _onTooltipCloseClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this._guideActive && this._isMultiRouteGuideStep()) {
      return;
    }
    this._trackFloatGa4('float_tooltip_close', 'float_tooltip_close', 'tooltip_close');
    this._dismissTooltip();
  }

  // 點擊對話框：送出 GA4 並開啟智慧選物
  _onTooltipClick(event) {
    if (event.target.closest('.ai-pd-container__tooltip-close')) {
      return;
    }
    event.preventDefault();
    this._trackFloatTooltipGa4();
    this._openSmartSelectionFromTooltip();
  }

  _onTooltipKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('.ai-pd-container__tooltip-close')) return;
    event.preventDefault();
    this._trackFloatTooltipGa4();
    this._openSmartSelectionFromTooltip();
  }

  async _onRouteCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const routeId = event.currentTarget.getAttribute('data-route-id');
    if (!routeId) return;

    const wasMultiRouteGuide = this._guideActive && this._isMultiRouteGuideStep();
    const modalWasOpen = this._modal && this._modal.visible;

    const manager = window.infMarketingManager;
    if (manager && typeof manager.switchRoute === 'function') {
      const switched = await manager.switchRoute(routeId);
      if (!switched) return;
    }

    this._trackFloatGa4('route_card_click', 'route_select', 'route_select', {
      selected_route: routeId
    });

    if (wasMultiRouteGuide && this._isGuideFeatureEnabled()) {
      this._markGuideDismissedStored();
      this._hideGuide();
      this._openSmartSelectionFromGuide();
      return;
    }

    if (modalWasOpen) {
      this._reloadModalForCurrentRoute();
      this._dismissTooltip();
      return;
    }

    this._openSmartSelectionFromTooltip();
  }

  // modal 已開啟時切換動線：強制以新 URL／設定重載 iframe
  _reloadModalForCurrentRoute() {
    if (!this._modal) return;
    const manager = window.infMarketingManager;
    if (manager && this._modal.setIframeConfig) {
      this._modal.setIframeConfig(manager.getIframeConfigPayload());
    }
    if (this.modalIframeUrl && this._modal.setIframeUrl) {
      this._modal.setIframeUrl(this.modalIframeUrl);
    }
    this._iframeIntroActive = false;
    this._syncGuideHelpVisibility();
  }

  _getGaContext() {
    return {
      brand: this.getAttribute('brand') || '',
      route: this.getAttribute('iframe-id') || ''
    };
  }

  // 浮動鈕相關 GA4（對話框／按鈕／引導／多動線）
  _trackFloatGa4(eventAction, eventLabel, action, extra) {
    var ctx = this._getGaContext();
    trackInfMarketingGa4(eventAction, {
      brand: ctx.brand,
      route: ctx.route,
      event_label: eventLabel || '',
      action: action || '',
      extra: extra || null
    });
  }

  _trackFloatTooltipGa4() {
    this._trackFloatGa4('float_tooltip_open', 'float_tooltip_open', 'tooltip_open');
  }

  // 由對話框開啟智慧選物（只開不關）
  _openSmartSelectionFromTooltip() {
    if (!this._modal) return;

    this._dismissTooltip();
    if (this._modal.visible) return;

    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    const isTabletOrLarger = window.innerWidth >= 768;

    if (isTabletOrLarger) {
      const position = this.getAttribute('position') || 'LeftDown';
      if (position === 'RightDown') {
        this._configureModalForRightDown();
      } else if (position === 'LeftDown') {
        this._configureModalForLeftDown();
      }
    } else {
      this._resetModalToCenter();
    }

    if (this.modalIframeUrl && this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
      this._modal.setIframeUrl(this.modalIframeUrl);
    } else if (this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
      this._modal.setIframeUrl('https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1');
    }

    if (anchor) {
      anchor.classList.add('ai-pd-container__anchor--modal-open');
    }

    const showOptions = {
      preventScroll: !isTabletOrLarger
    };

    this._triggerFindINFProductAI();
    this._modal.show(null, showOptions);
  }

  _stopTypewriter() {
    if (this._typewriterTimer) {
      clearTimeout(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  // 打字機效果：逐字顯示一次，完成後呈現一般文字
  _startTypewriter() {
    this._stopTypewriter();
    const textEl = this.shadowRoot.querySelector('.ai-pd-container__tooltip-text');
    if (!textEl) return;

    const tooltipText = this._getTooltipText();
    if (!tooltipText) return;

    if (this._typewriterCompleted) {
      textEl.textContent = tooltipText;
      textEl.classList.add('ai-pd-container__tooltip-text--done');
      return;
    }

    textEl.classList.remove('ai-pd-container__tooltip-text--done');

    const prefersReducedMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      textEl.textContent = tooltipText;
      textEl.classList.add('ai-pd-container__tooltip-text--done');
      this._typewriterCompleted = true;
      return;
    }

    let index = 0;
    textEl.textContent = '';

    const typeNext = () => {
      if (this._tooltipDismissed) return;
      if (index < tooltipText.length) {
        textEl.textContent = tooltipText.slice(0, index + 1);
        index += 1;
        this._typewriterTimer = setTimeout(typeNext, 90);
        return;
      }
      this._typewriterTimer = null;
      this._typewriterCompleted = true;
      textEl.classList.add('ai-pd-container__tooltip-text--done');
    };

    typeNext();
  }

  // modal 關閉後，搜尋或結果狀態且未手動關閉時顯示對話框
  _syncTooltipVisibility() {
    const tooltip = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap');
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!tooltip || !trigger) {
      this._syncGuideHelpVisibility();
      return;
    }

    // 多動線導覽第一步：保留 tooltip；其餘引導中隱藏
    if (
      (this._guideActive && !this._isMultiRouteGuideStep())
      || this._isModalOpen
      || (this._modal && this._modal.visible)
    ) {
      tooltip.hidden = true;
      this._stopTypewriter();
      this._syncGuideHelpVisibility();
      return;
    }

    const isInviteState = !trigger.classList.contains('ai-pd-container__trigger--close');

    if (this._shouldUseMultiRouteTooltip()) {
      const titleEl = this.shadowRoot.querySelector('.ai-pd-container__tooltip-panel-title');
      const tooltipText = this._getTooltipText();
      if (titleEl && tooltipText) {
        titleEl.textContent = tooltipText;
      }
      const forceShowForGuide = this._guideActive && this._isMultiRouteGuideStep();
      if ((forceShowForGuide || !this._tooltipDismissed) && isInviteState && !this._isTooltipDisabledByText()) {
        tooltip.hidden = false;
      } else {
        tooltip.hidden = true;
      }
      if (forceShowForGuide) {
        this._syncMultiRouteInlineGuide();
      }
      this._syncGuideHelpVisibility();
      return;
    }

    if (!this._tooltipDismissed && isInviteState && !this._isTooltipDisabledByText()) {
      const needsStart = tooltip.hidden || (!this._typewriterTimer && !this._typewriterCompleted);
      tooltip.hidden = false;
      if (needsStart) {
        this._startTypewriter();
      } else if (this._typewriterCompleted) {
        const textEl = this.shadowRoot.querySelector('.ai-pd-container__tooltip-text');
        const tooltipText = this._getTooltipText();
        if (textEl && tooltipText) {
          textEl.textContent = tooltipText;
          textEl.classList.add('ai-pd-container__tooltip-text--done');
        }
      }
    } else {
      tooltip.hidden = true;
      this._stopTypewriter();
    }
    this._syncGuideHelpVisibility();
  }

  _shouldShowMultiRouteReopen() {
    if (!this._isMultiRouteEnabled() || this._getMultiRouteList().length === 0) return false;
    if (this._guideActive || this._iframeIntroActive) return false;
    if (this._isModalOpen || (this._modal && this._modal.visible)) return false;
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!trigger || trigger.classList.contains('ai-pd-container__trigger--close')) return false;
    if (this._isTooltipDisabledByText()) return false;
    return this._tooltipDismissed;
  }

  _reopenMultiRoutePanel() {
    this._tooltipDismissed = false;
    this._syncTooltipVisibility();
  }

  // ---- 遮罩引導教學 ----
  _isGuideDismissedStored() {
    try {
      return localStorage.getItem(FLOATING_GUIDE_STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  _markGuideDismissedStored() {
    try {
      localStorage.setItem(FLOATING_GUIDE_STORAGE_KEY, '1');
    } catch (e) {
      // 隱私模式等無法寫入時略過
    }
  }

  _clearGuideDismissedStored() {
    try {
      localStorage.removeItem(FLOATING_GUIDE_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  _isGuideFeatureEnabled() {
    return this.getAttribute('enable-guide') === 'true';
  }

  _isMultiRouteGuideStep() {
    return this._guideStep === 'multi-route';
  }

  _shouldForceShowGuide() {
    return this.getAttribute('show-float-guide') === 'true';
  }

  _initFloatGuide() {
    // 預設關閉；需 options.enable_guide === true 才啟用引導
    if (!this._isGuideFeatureEnabled()) {
      this._hideGuide();
      this._syncGuideHelpVisibility();
      return;
    }
    if (this._shouldForceShowGuide() || !this._isGuideDismissedStored()) {
      this._showGuide();
    } else {
      this._hideGuide();
      this._syncGuideHelpVisibility();
    }
  }

  _getGuideCardAlignClass() {
    const position = this.getAttribute('position') || 'LeftDown';
    if (position === 'RightDown') return 'ai-pd-container__guide-card--align-end';
    if (position === 'LeftDown') return 'ai-pd-container__guide-card--align-start';
    return 'ai-pd-container__guide-card--align-center';
  }

  _resetGuideCardPosition() {
    const card = this.shadowRoot.querySelector('.ai-pd-container__guide-card');
    if (!card) return;
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.bottom = '';
    card.style.right = '';
    card.style.transform = '';
  }

  _syncMultiRouteInlineGuide() {
    const footer = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-footer');
    const sectionLabel = this.shadowRoot.querySelector('.ai-pd-container__route-section-label');
    const panel = this.shadowRoot.querySelector('.ai-pd-container__tooltip-panel');
    const tooltipWrap = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap--multi');
    const closeBtn = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap--multi .ai-pd-container__tooltip-close');
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    const isGuide = this._guideActive && this._isMultiRouteGuideStep();
    if (footer) footer.hidden = !isGuide;
    if (sectionLabel) sectionLabel.hidden = !isGuide;
    if (closeBtn) closeBtn.hidden = isGuide;
    if (panel) panel.classList.toggle('ai-pd-container__tooltip-panel--guide-active', isGuide);
    if (tooltipWrap) tooltipWrap.classList.toggle('ai-pd-container__tooltip-wrap--guide-badge-up', isGuide);
    if (trigger) trigger.classList.toggle('ai-pd-container__trigger--guide-secondary-spotlight', isGuide);
  }

  _updateGuideCardForStep() {
    const card = this.shadowRoot.querySelector('.ai-pd-container__guide-card');
    const cardText = this.shadowRoot.querySelector('.ai-pd-container__guide-card-text');
    const startBtn = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--start');
    if (!cardText || !card) return;

    if (this._isMultiRouteGuideStep()) {
      card.hidden = true;
      if (startBtn) startBtn.hidden = true;
      this._syncMultiRouteInlineGuide();
      return;
    }

    card.hidden = false;
    cardText.textContent = this._t('float.guideTapHere');
    if (startBtn) {
      startBtn.hidden = false;
      startBtn.textContent = this._t('float.guideStart');
    }
    card.classList.remove('ai-pd-container__guide-card--multi-route');
    this._resetGuideCardPosition();
    const footer = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-footer');
    const sectionLabel = this.shadowRoot.querySelector('.ai-pd-container__route-section-label');
    if (footer) footer.hidden = true;
    if (sectionLabel) sectionLabel.hidden = true;
    const panel = this.shadowRoot.querySelector('.ai-pd-container__tooltip-panel');
    if (panel) panel.classList.remove('ai-pd-container__tooltip-panel--guide-active');
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (trigger) trigger.classList.remove('ai-pd-container__trigger--guide-secondary-spotlight');
  }

  _clearGuideSpotlights() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (trigger) {
      trigger.classList.remove('ai-pd-container__trigger--guide-spotlight');
      trigger.classList.remove('ai-pd-container__trigger--guide-secondary-spotlight');
    }
    const panel = this.shadowRoot.querySelector('.ai-pd-container__tooltip-panel');
    if (panel) panel.classList.remove('ai-pd-container__tooltip-panel--guide-active');
    const tooltipWrap = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap--multi');
    if (tooltipWrap) tooltipWrap.classList.remove('ai-pd-container__tooltip-wrap--guide-badge-up');
    const footer = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-footer');
    const sectionLabel = this.shadowRoot.querySelector('.ai-pd-container__route-section-label');
    const closeBtn = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap--multi .ai-pd-container__tooltip-close');
    if (footer) footer.hidden = true;
    if (sectionLabel) sectionLabel.hidden = true;
    if (closeBtn) closeBtn.hidden = false;
  }

  _applyGuideSpotlight() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    this._clearGuideSpotlights();
    if (this._isMultiRouteGuideStep()) {
      this._syncMultiRouteInlineGuide();
    } else if (trigger) {
      trigger.classList.add('ai-pd-container__trigger--guide-spotlight');
    }
  }

  _showGuide() {
    const mask = this.shadowRoot.querySelector('.ai-pd-container__guide-mask');
    const card = this.shadowRoot.querySelector('.ai-pd-container__guide-card');
    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    const help = this.shadowRoot.querySelector('.ai-pd-container__guide-help');
    if (!mask || !card || !anchor || !trigger) return;

    this._guideStep = this._shouldUseMultiRouteTooltip() ? 'multi-route' : 'float-button';
    this._guideActive = true;
    mask.hidden = false;
    card.classList.remove(
      'ai-pd-container__guide-card--align-start',
      'ai-pd-container__guide-card--align-end',
      'ai-pd-container__guide-card--align-center'
    );
    card.classList.add(this._getGuideCardAlignClass());
    anchor.classList.add('ai-pd-container__anchor--guide-active');
    this._updateGuideCardForStep();
    this._applyGuideSpotlight();
    if (help) help.hidden = true;
    this._syncTooltipVisibility();
    this._syncGuideHelpVisibility();
  }

  _hideGuide() {
    const mask = this.shadowRoot.querySelector('.ai-pd-container__guide-mask');
    const card = this.shadowRoot.querySelector('.ai-pd-container__guide-card');
    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    const startBtn = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--start');
    const inlineGuide = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-footer');
    const sectionLabel = this.shadowRoot.querySelector('.ai-pd-container__route-section-label');
    if (mask) mask.hidden = true;
    if (card) {
      card.hidden = true;
      card.classList.remove('ai-pd-container__guide-card--multi-route');
    }
    if (inlineGuide) inlineGuide.hidden = true;
    if (sectionLabel) sectionLabel.hidden = true;
    if (startBtn) startBtn.hidden = false;
    if (anchor) anchor.classList.remove('ai-pd-container__anchor--guide-active');
    this._clearGuideSpotlights();
    this._resetGuideCardPosition();
    this._guideStep = 'float-button';
    this._guideActive = false;
    // 引導結束後恢復 float_tooltip（若尚未被使用者手動關閉）
    this._syncTooltipVisibility();
    this._syncGuideHelpVisibility();
  }

  _isMultiRoutePanelOpen() {
    if (!this._shouldUseMultiRouteTooltip()) return false;
    if (this._tooltipDismissed || this._isTooltipDisabledByText()) return false;
    if (this._isModalOpen || (this._modal && this._modal.visible)) return false;
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!trigger || trigger.classList.contains('ai-pd-container__trigger--close')) return false;
    return true;
  }

  _syncGuideHelpVisibility() {
    const help = this.shadowRoot.querySelector('.ai-pd-container__guide-help');
    const reopen = this.shadowRoot.querySelector('.ai-pd-container__multi-route-reopen');
    const isMultiRoute = this._isMultiRouteEnabled() && this._getMultiRouteList().length > 0;

    const showReplayGuide = this._isGuideFeatureEnabled()
      && !this._guideActive
      && !this._iframeIntroActive
      && this._isGuideDismissedStored();

    // 多動線：列表 icon 與 ? 互斥——面板開啟顯示 ?，面板關閉顯示列表
    const showReopen = isMultiRoute && this._shouldShowMultiRouteReopen();
    if (reopen) {
      reopen.hidden = !showReopen;
    }

    if (help) {
      let showHelp = showReplayGuide;
      if (isMultiRoute) {
        showHelp = showReplayGuide && this._isMultiRoutePanelOpen();
      }
      help.hidden = !showHelp;
    }
  }

  _onMultiRouteReopenClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this._trackFloatGa4('multi_route_reopen', 'reopen_panel', 'reopen');
    if (this._modal && this._modal.visible) {
      this._modal.hide();
      const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
      if (anchor) anchor.classList.remove('ai-pd-container__anchor--modal-open');
    }
    this._reopenMultiRoutePanel();
  }

  _onGuideStartClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this._trackFloatGa4('guide_start_open', 'guide_start_open', 'guide_open');
    this._completeGuideAndOpen();
  }

  _onGuideSkipClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this._trackFloatGa4('guide_skip', 'guide_skip', 'guide_skip');
    this._markGuideDismissedStored();
    this._hideGuide();
  }

  _onGuideHelpClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this._trackFloatGa4('guide_replay', 'guide_replay', 'guide_replay');
    // 若 modal 開著先關，再重開引導
    if (this._modal && this._modal.visible) {
      this._modal.hide();
      const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
      if (anchor) anchor.classList.remove('ai-pd-container__anchor--modal-open');
    }
    this._clearGuideDismissedStored();
    this._showGuide();
  }

  _completeGuideAndOpen() {
    this._markGuideDismissedStored();
    this._hideGuide();
    this._openSmartSelectionFromGuide();
  }

  // 由引導開啟智慧選物，並通知 iframe 重跑 intro
  _openSmartSelectionFromGuide() {
    if (!this._modal) return;

    // 引導開啟不永久關閉對話框；關掉 modal 後仍可再顯示 float_tooltip
    if (this._modal.visible) {
      this._notifyIframeStartIntro();
      return;
    }

    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    const isTabletOrLarger = window.innerWidth >= 768;

    if (isTabletOrLarger) {
      const position = this.getAttribute('position') || 'LeftDown';
      if (position === 'RightDown') {
        this._configureModalForRightDown();
      } else if (position === 'LeftDown') {
        this._configureModalForLeftDown();
      }
    } else {
      this._resetModalToCenter();
    }

    if (this.modalIframeUrl && this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
      this._modal.setIframeUrl(this.modalIframeUrl);
    } else if (this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
      this._modal.setIframeUrl('https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1');
    }

    if (anchor) {
      anchor.classList.add('ai-pd-container__anchor--modal-open');
    }

    const showOptions = {
      preventScroll: !isTabletOrLarger
    };

    this._triggerFindINFProductAI();
    this._modal.show(null, showOptions);
    this._notifyIframeStartIntro();
  }

  _notifyIframeStartIntro() {
    try {
      if (!this._modal || !this._isGuideFeatureEnabled()) return;
      // 等 iframe 引導結束再顯示「?」
      this._iframeIntroActive = true;
      this._syncGuideHelpVisibility();
      const introMode = (this._modal.iframeConfig &&
        (this._modal.iframeConfig.intro_mode === 'v1' || this._modal.iframeConfig.intro_mode === 'v2'))
        ? this._modal.iframeConfig.intro_mode
        : null;
      const iframe = this._modal.shadowRoot
        && (this._modal.shadowRoot.querySelector('#iframe-container iframe')
          || this._modal.shadowRoot.querySelector('#iframe-container-content'));
      if (iframe && iframe.contentWindow) {
        if (typeof this._modal.sendIframeMessage === 'function') {
          this._modal.sendIframeMessage(iframe);
        }
        iframe.contentWindow.postMessage(
          {
            header: 'parent_start_intro',
            intro_mode: introMode,
            enable_guide: true
          },
          '*'
        );
      }
    } catch (e) {
      console.warn('無法向 iframe 發送 parent_start_intro:', e);
    }
  }

  // 設置結果狀態（當有搜尋結果時調用）
  setResultState() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!trigger) return;
    
    trigger.classList.remove('ai-pd-container__trigger--search');
    trigger.classList.remove('ai-pd-container__trigger--close');
    trigger.classList.add('ai-pd-container__trigger--result');
    trigger.title = this._t('float.viewResults');
    this._syncTooltipVisibility();
  }

  // 重置為搜尋狀態
  resetToSearchState() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!trigger) return;
    
    trigger.classList.remove('ai-pd-container__trigger--result');
    trigger.classList.remove('ai-pd-container__trigger--close');
    trigger.classList.add('ai-pd-container__trigger--search');
    trigger.title = this._t('float.openSmartSelection');
    this._syncTooltipVisibility();
  }

  // 設置 iframe 消息監聽器
  _setupIframeMessageListener() {
    // 綁定 this 上下文
    this._boundHandleIframeMessage = this._handleIframeMessage.bind(this);
    
    // 監聽來自 iframe 的 postMessage
    window.addEventListener('message', this._boundHandleIframeMessage);
  }

  // 處理 iframe 消息
  _handleIframeMessage(event) {
    try {
      // 檢查消息格式
      if (event.data && typeof event.data === 'object') {
        // iframe 內引導開始／結束 → 同步「?」顯示
        if (event.data.header === 'iframe_intro_tour') {
          this._iframeIntroActive = event.data.active === true;
          this._syncGuideHelpVisibility();
          if (!event.data.active) {
            this._syncTooltipVisibility();
          }
          return;
        }

        const { type, value } = event.data;
        
        // 監聽 iframe 回傳值 type === 'result'
        if (type === 'result') {
          if (value) {
            // 有搜尋結果時，記錄狀態並在彈窗關閉時顯示結果狀態
            this._hasResult = true;
            // 完成推薦：iframe 回傳推薦結果
            this._trackFloatGa4('complete_recommend', 'complete_recommend', 'complete');
            const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
            if (trigger && trigger.classList.contains('ai-pd-container__trigger--search')) {
              // 只有在搜尋狀態（彈窗關閉）時才切換到結果狀態
              this.setResultState();
            }
          } else {
            // 沒有搜尋結果時，清除結果狀態並重置為搜尋狀態
            this._hasResult = false;
            this.resetToSearchState();
          }
        }
        if (type === 'run_routeproduct_success') {
            // console.log('run_routeproduct_success');
           window.showInfMarketing();
        }
      }
    } catch (error) {
      console.warn('處理 iframe 消息時發生錯誤:', error);
    }
  }

  // 移除 iframe 消息監聽器
  _removeIframeMessageListener() {
    if (this._boundHandleIframeMessage) {
      window.removeEventListener('message', this._boundHandleIframeMessage);
    }
  }

  // 獲取位置樣式
  getPositionStyles() {
    const position = this.getAttribute('position') || 'LeftDown';
    const positions = {
      'RightDown': {
        bottom: '16px',
        right: '16px',
        left: 'auto',
        top: 'auto',
        transform: 'none'
      },
      'LeftDown': {
        bottom: '16px',
        left: '16px',
        right: 'auto',
        top: 'auto',
        transform: 'none'
      },
      'CenterDown': {
        bottom: '16px',
        left: '50%',
        right: 'auto',
        top: 'auto',
        transform: 'translateX(-50%)'
      },
      'Center': {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)'
      }
    };
    return positions[position] || positions['LeftDown'];
  }

  // 依按鈕位置決定對話框水平對齊，避免超出視窗
  getTooltipAlignClass() {
    const position = this.getAttribute('position') || 'LeftDown';
    if (position === 'RightDown') {
      return 'ai-pd-container__tooltip-wrap--align-end';
    }
    if (position === 'LeftDown') {
      return 'ai-pd-container__tooltip-wrap--align-start';
    }
    return 'ai-pd-container__tooltip-wrap--align-center';
  }

  // 更新位置
  updatePosition() {
    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');
    if (anchor) {
      const positionStyles = this.getPositionStyles();
      
      // 清除所有位置樣式
      anchor.style.bottom = '';
      anchor.style.right = '';
      anchor.style.left = '';
      anchor.style.top = '';
      anchor.style.transform = '';
      
      // 設置新的位置樣式
      if (positionStyles.bottom) anchor.style.bottom = positionStyles.bottom;
      if (positionStyles.right) anchor.style.right = positionStyles.right;
      if (positionStyles.left) anchor.style.left = positionStyles.left;
      if (positionStyles.top) anchor.style.top = positionStyles.top;
      if (positionStyles.transform) anchor.style.transform = positionStyles.transform;
    }

    const tooltip = this.shadowRoot.querySelector('.ai-pd-container__tooltip-wrap');
    if (tooltip) {
      tooltip.classList.remove(
        'ai-pd-container__tooltip-wrap--align-start',
        'ai-pd-container__tooltip-wrap--align-end',
        'ai-pd-container__tooltip-wrap--align-center'
      );
      tooltip.classList.add(this.getTooltipAlignClass());
    }
  }

  // 設置事件監聽器
  setupEventListeners() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (trigger) {
      trigger.addEventListener('click', this._onButtonClick);
    }
    const tooltipClose = this.shadowRoot.querySelector('.ai-pd-container__tooltip-close');
    if (tooltipClose) {
      tooltipClose.addEventListener('click', this._onTooltipCloseClick);
    }
    const tooltip = this.shadowRoot.querySelector('.ai-pd-container__tooltip');
    if (tooltip) {
      tooltip.addEventListener('click', this._onTooltipClick);
      tooltip.addEventListener('keydown', this._onTooltipKeyDown);
    }
    this.shadowRoot.querySelectorAll('.ai-pd-container__route-card').forEach((card) => {
      card.addEventListener('click', this._onRouteCardClick);
    });
    const guideStart = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--start');
    if (guideStart) {
      guideStart.addEventListener('click', this._onGuideStartClick);
    }
    const guideSkip = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--skip');
    if (guideSkip) {
      guideSkip.addEventListener('click', this._onGuideSkipClick);
    }
    const inlineGuideSkip = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-skip');
    if (inlineGuideSkip) {
      inlineGuideSkip.addEventListener('click', this._onGuideSkipClick);
    }
    const guideHelp = this.shadowRoot.querySelector('.ai-pd-container__guide-help');
    if (guideHelp) {
      guideHelp.addEventListener('click', this._onGuideHelpClick);
    }
    const multiRouteReopen = this.shadowRoot.querySelector('.ai-pd-container__multi-route-reopen');
    if (multiRouteReopen) {
      multiRouteReopen.addEventListener('click', this._onMultiRouteReopenClick);
    }
  }

  // 設置彈窗 iframe URL（統一接口）
  setModalIframeUrl(url) {
    this.modalIframeUrl = url;
    
    // 如果 modal 已存在，立即設置
    if (this._modal && this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
      this._modal.setIframeUrl(url);
    }
  }

  // 移除事件監聽器
  removeEventListeners() {
    const trigger = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (trigger) {
      trigger.removeEventListener('click', this._onButtonClick);
    }
    const tooltipClose = this.shadowRoot.querySelector('.ai-pd-container__tooltip-close');
    if (tooltipClose) {
      tooltipClose.removeEventListener('click', this._onTooltipCloseClick);
    }
    const tooltip = this.shadowRoot.querySelector('.ai-pd-container__tooltip');
    if (tooltip) {
      tooltip.removeEventListener('click', this._onTooltipClick);
      tooltip.removeEventListener('keydown', this._onTooltipKeyDown);
    }
    this.shadowRoot.querySelectorAll('.ai-pd-container__route-card').forEach((card) => {
      card.removeEventListener('click', this._onRouteCardClick);
    });
    const guideStart = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--start');
    if (guideStart) {
      guideStart.removeEventListener('click', this._onGuideStartClick);
    }
    const guideSkip = this.shadowRoot.querySelector('.ai-pd-container__guide-btn--skip');
    if (guideSkip) {
      guideSkip.removeEventListener('click', this._onGuideSkipClick);
    }
    const inlineGuideSkip = this.shadowRoot.querySelector('.ai-pd-container__multi-route-guide-skip');
    if (inlineGuideSkip) {
      inlineGuideSkip.removeEventListener('click', this._onGuideSkipClick);
    }
    const guideHelp = this.shadowRoot.querySelector('.ai-pd-container__guide-help');
    if (guideHelp) {
      guideHelp.removeEventListener('click', this._onGuideHelpClick);
    }
    const multiRouteReopen = this.shadowRoot.querySelector('.ai-pd-container__multi-route-reopen');
    if (multiRouteReopen) {
      multiRouteReopen.removeEventListener('click', this._onMultiRouteReopenClick);
    }
  }

  // 渲染組件
  render() {
    const positionStyles = this.getPositionStyles();
    const tooltipAlignClass = this.getTooltipAlignClass();
    const guideAlignClass = this._getGuideCardAlignClass();
    const position = this.getAttribute('position') || 'LeftDown';
    const anchorAlignClass = position === 'RightDown' ? 'ai-pd-container__anchor--align-end' : '';
    const tooltipText = this._getTooltipText();
    const tooltipAriaLabel = this._getTooltipAriaLabel(tooltipText);
    const closeTooltipLabel = escapeHtmlForTooltip(this._t('float.closeTooltip'));
    const guideTapHere = escapeHtmlForTooltip(this._t('float.guideTapHere'));
    const guideSkip = escapeHtmlForTooltip(this._t('float.guideSkip'));
    const guideStart = escapeHtmlForTooltip(this._t('float.guideStart'));
    const guideReplay = escapeHtmlForTooltip(this._t('float.guideReplay'));
    const multiRouteReopen = escapeHtmlForTooltip(this._t('float.multiRouteReopen'));
    const multiRouteSectionLabel = escapeHtmlForTooltip(this._t('float.multiRouteSectionLabel'));
    const multiRouteGuideHint = escapeHtmlForTooltip(this._t('float.multiRouteGuideHint'));
    const multiRouteGuideSkip = escapeHtmlForTooltip(this._t('float.multiRouteGuideSkip'));
    const openSmartSelection = escapeHtmlForTooltip(this._t('float.openSmartSelection'));
    const hideTooltip = this._tooltipDismissed || this._isTooltipDisabledByText()
      || (this._guideActive && !this._isMultiRouteGuideStep());
    const useMultiRoute = this._shouldUseMultiRouteTooltip();
    const routeCardsHtml = useMultiRoute
      ? this._getMultiRouteList().map((item) => {
          const labelRaw = this._getRouteCardLabel(item);
          const label = escapeHtmlForTooltip(labelRaw);
          const routeIdRaw = String(item.route || '');
          const routeId = escapeHtmlForTooltip(routeIdRaw);
          const selectedId = this._getMultiRouteSelectedId();
          const isSelected = !!(selectedId && routeIdRaw === selectedId);
          const selectedClass = isSelected ? ' ai-pd-container__route-card--selected' : '';
          const ariaCurrent = isSelected ? ' aria-current="true"' : '';
          return `<button type="button" class="ai-pd-container__route-card${selectedClass}" data-route-id="${routeId}" aria-label="${label}"${ariaCurrent}><span class="ai-pd-container__route-card-text">${label}</span><span class="ai-pd-container__route-card-arrow" aria-hidden="true">›</span></button>`;
        }).join('')
      : '';
    const tooltipHtml = useMultiRoute
      ? `
          <div class="ai-pd-container__tooltip-wrap ai-pd-container__tooltip-wrap--multi ${tooltipAlignClass}" ${hideTooltip ? 'hidden' : ''}>
            <span class="ai-pd-container__tooltip-badge" aria-hidden="true"><img class="ai-pd-container__tooltip-badge-img" src="${FLOATING_TOOLTIP_LOGO_SRC}" alt="" /></span>
            <div class="ai-pd-container__tooltip-panel">
              <div class="ai-pd-container__tooltip-panel-header">
                <button class="ai-pd-container__tooltip-close" type="button" aria-label="${closeTooltipLabel}">&times;</button>
                <p class="ai-pd-container__tooltip-panel-title">${escapeHtmlForTooltip(tooltipText)}</p>
              </div>
              <div class="ai-pd-container__route-section">
                <p class="ai-pd-container__route-section-label" hidden>${multiRouteSectionLabel}</p>
                <div class="ai-pd-container__route-list" role="list">
                  ${routeCardsHtml}
                </div>
              </div>
              <div class="ai-pd-container__multi-route-guide-footer" hidden>
                <p class="ai-pd-container__multi-route-guide-hint">${multiRouteGuideHint}</p>
                <button type="button" class="ai-pd-container__multi-route-guide-skip">${multiRouteGuideSkip}</button>
              </div>
            </div>
          </div>`
      : `
          <div class="ai-pd-container__tooltip-wrap ${tooltipAlignClass}" ${hideTooltip ? 'hidden' : ''}>
            <span class="ai-pd-container__tooltip-badge" aria-hidden="true"><img class="ai-pd-container__tooltip-badge-img" src="${FLOATING_TOOLTIP_LOGO_SRC}" alt="" /></span>
            <div class="ai-pd-container__tooltip" role="button" tabindex="0">
              <button class="ai-pd-container__tooltip-close" type="button" aria-label="${closeTooltipLabel}">&times;</button>
              <div class="ai-pd-container__tooltip-typewriter">
                <span class="ai-pd-container__tooltip-text"></span>
              </div>
            </div>
          </div>`;
    
    this.shadowRoot.innerHTML = `
      <style>${FLOATING_BTN_STYLE}</style>
      <div class="ai-pd-container">
        <div class="ai-pd-container__guide-mask" hidden></div>
        <div class="ai-pd-container__anchor ${anchorAlignClass}" style="
          bottom: ${positionStyles.bottom};
          right: ${positionStyles.right};
          left: ${positionStyles.left};
          top: ${positionStyles.top};
          transform: ${positionStyles.transform};
        ">
          <div class="ai-pd-container__guide-card ${guideAlignClass}" hidden>
            <p class="ai-pd-container__guide-card-text">${guideTapHere}</p>
            <div class="ai-pd-container__guide-card-actions">
              <button class="ai-pd-container__guide-btn ai-pd-container__guide-btn--skip" type="button">${guideSkip}</button>
              <button class="ai-pd-container__guide-btn ai-pd-container__guide-btn--start" type="button">${guideStart}</button>
            </div>
          </div>
          ${tooltipHtml}
          <div class="ai-pd-container__trigger-wrap${useMultiRoute ? ' ai-pd-container__trigger-wrap--multi-route' : ''}">
            <button class="ai-pd-container__trigger ai-pd-container__trigger--search" type="button" title="${openSmartSelection}">
              <div class="ai-pd-container__icon"></div>
              <img class="ai-pd-container__icon--alert" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMTBDMTQuNDc3MiAxMCAxMCA1LjUyMjggMTAgLTQuMzcxMTRlLTA3QzEwIDUuNTIyOCA1LjUyMjggMTAgMy4zNzc1OGUtMDYgMTBDNS41MjI4IDEwIDEwIDE0LjQ3NzIgMTAgMjBDMTAgMTQuNDc3MiAxNC40NzcyIDEwIDIwIDEwWiIgZmlsbD0iI0Y5RkY5NCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4K" alt="alert" />
            </button>
            <button class="ai-pd-container__guide-help" type="button" title="${guideReplay}" aria-label="${guideReplay}" hidden>?</button>
            <button class="ai-pd-container__multi-route-reopen" type="button" title="${multiRouteReopen}" aria-label="${multiRouteReopen}" hidden>${MULTI_ROUTE_REOPEN_ICON}</button>
          </div>
        </div>
      </div>
    `;
    if (!useMultiRoute) {
      const tooltipEl = this.shadowRoot.querySelector('.ai-pd-container__tooltip');
      if (tooltipEl) {
        tooltipEl.setAttribute('aria-label', tooltipAriaLabel);
      }
    }
  }

  _onButtonClick() {
    if (!this._modal) return;

    // 引導進行中：點浮動鈕直接完成引導並開啟彈窗（多動線不再進入第二步浮動鈕引導）
    if (this._guideActive) {
      this._trackFloatGa4('guide_float_open', 'guide_float_open', 'guide_open');
      this._completeGuideAndOpen();
      return;
    }
    
    const anchor = this.shadowRoot.querySelector('.ai-pd-container__anchor');

    if (this._modal.visible) {
      this._trackFloatGa4('float_button_close', 'float_close', 'close');
      this._modal.hide();
      // 關閉 modal 不永久關閉 tooltip；關閉後由 hide 事件恢復顯示
      if (anchor) {
        anchor.classList.remove('ai-pd-container__anchor--modal-open');
      }
    } else {
      this._trackFloatGa4('float_button_open', 'float_open', 'open');
      // 開啟 modal 才永久關閉本次瀏覽的打字機對話框
      this._dismissTooltip();
      // 檢查螢幕尺寸，只在平板以上才啟用對話框效果
      const isTabletOrLarger = window.innerWidth >= 768;
      
      if (isTabletOrLarger) {
        // 檢查當前位置，如果是 RightDown 或 LeftDown，則設置彈窗位置
        const position = this.getAttribute('position') || 'LeftDown';
        if (position === 'RightDown') {
          this._configureModalForRightDown();
        } else if (position === 'LeftDown') {
          this._configureModalForLeftDown();
        }
      } else {
        // 小螢幕保持原本的中央顯示效果
        this._resetModalToCenter();
      }
      
      // 使用統一的 iframe URL 設置
      if (this.modalIframeUrl && this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
        this._modal.setIframeUrl(this.modalIframeUrl);
      } else if (this._modal.setIframeUrl && typeof this._modal.setIframeUrl === 'function') {
        // 如果沒有設置 modalIframeUrl，使用預設 URL（保持向後兼容）
        this._modal.setIframeUrl('https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1');
      }
      
      // 彈窗開啟時，添加 modal-open 類別，z-index 設為 2000000000
      if (anchor) {
        anchor.classList.add('ai-pd-container__anchor--modal-open');
      }
      
      // 平板以上不鎖定背景滾動，小螢幕保持原本行為
      const showOptions = {
        preventScroll: !isTabletOrLarger
      };
      
      // 觸發 FindINF_ProductAI.js 相關功能
      this._triggerFindINFProductAI();
      
      this._modal.show(null, showOptions);
    }
  }

  // 觸發 FindINF_ProductAI.js 相關功能
  _triggerFindINFProductAI() {
    try {
      // 檢查是否存在 FindINF_proc 函數（FindINF_ProductAI.js 中定義的函數）
      if (typeof window.FindINF_proc === 'function') {
        // console.log('找到 FindINF_proc 函數，正在調用...');
        // 調用 FindINF_proc 函數，傳入品牌和電商數據
        const brand = this.getAttribute('brand') || 'INF';
        const ecommerce = {}; // 空的電商數據對象
        window.FindINF_proc(brand, ecommerce);
      } else {
        // 嘗試動態載入 FindINF_ProductAI.js（如果尚未載入）
        this._loadFindINFProductAIScript();
      }
      
      // 觸發自定義事件，讓其他腳本可以監聽
      window.dispatchEvent(new CustomEvent('FindINF_ProductAI_triggered', {
        detail: {
          source: 'InfMarketingFloatButtonComponent',
          timestamp: Date.now(),
          triggerType: 'search_button_click',
          brand: this.getAttribute('brand') || 'INF'
        }
      }));
      
    } catch (error) {
      console.warn('觸發 FindINF_ProductAI 時發生錯誤:', error);
    }
  }

  // 動態載入 FindINF_ProductAI.js 腳本
  _loadFindINFProductAIScript() {
    // 檢查腳本是否已經載入
    if (document.querySelector('script[src*="FindINF_ProductAI.js"]')) {
    //   console.log('FindINF_ProductAI.js 腳本已存在');
      return;
    }
    
    console.log('FindINF_ProductAI.js 已整合到當前檔案中，直接調用 FindINF_proc 函數...');
    
    // 直接調用已整合的 FindINF_proc 函數
    if (typeof window.FindINF_proc === 'function') {
      const brand = this.getAttribute('brand') || 'INF';
      const ecommerce = {}; // 空的電商數據對象
      window.FindINF_proc(brand, ecommerce);
      console.log('FindINF_proc 函數調用完成');
    } else {
      console.warn('FindINF_proc 函數未找到，請檢查整合是否成功');
    }
  }

  // 重置彈窗為中央顯示
  _resetModalToCenter() {
    if (!this._modal) return;

    const modalContent = this._modal.shadowRoot?.querySelector('#modal-content');
    const modalOverlay = this._modal.shadowRoot?.querySelector('#modal-overlay');
    const closeBtn = this._modal.shadowRoot?.querySelector('#close-btn');
    
    if (modalContent) {
      // 清除所有自定義位置樣式，恢復預設的中央顯示
      modalContent.style.position = '';
      modalContent.style.left = '';
      modalContent.style.right = '';
      modalContent.style.top = '';
      modalContent.style.bottom = '';
      modalContent.style.transform = '';
      modalContent.style.transition = '';
    }
    
    // 恢復背景遮罩和關閉按鈕
    if (modalOverlay) {
      modalOverlay.style.display = 'block';
    }
    if (closeBtn) {
      closeBtn.style.setProperty('display', 'none', 'important');
    }
    
    // 移除對話框模式類別
    const modalContainer = this._modal.shadowRoot?.querySelector('#modal-container');
    if (modalContainer) {
      modalContainer.classList.remove('dialog-mode');
    }
    
    // 移除 Modal 組件本身的對話框模式類別
    this._modal.classList.remove('dialog-mode');
  }

  // 為 RightDown 位置配置彈窗
  _configureModalForRightDown() {
    if (!this._modal) return;

    // 獲取按鈕的位置
    const button = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const modalContent = this._modal.shadowRoot?.querySelector('#modal-content');
    const modalOverlay = this._modal.shadowRoot?.querySelector('#modal-overlay');
    const closeBtn = this._modal.shadowRoot?.querySelector('#close-btn');
    
    if (modalContent) {
      // 計算彈窗應該顯示的位置
      // 彈窗顯示在按鈕上方 20px，右側對齊按鈕右側
      const modalWidth = 480; // 彈窗寬度
      const modalHeight = 480; // 彈窗高度
      const buttonWidth = buttonRect.width;
      const buttonHeight = buttonRect.height;
      
      // 計算彈窗位置
      const modalRight = window.innerWidth - buttonRect.right; // 右側距離
      const modalBottom = window.innerHeight - buttonRect.top + 20; // 按鈕上方 20px
      
      // 確保彈窗不會超出視窗邊界
      const adjustedRight = Math.max(16, modalRight); // 最小右邊距 16px
      const adjustedBottom = Math.max(16, modalBottom); // 最小下邊距 16px
      
      // 如果彈窗會超出左邊界，調整位置
      const maxLeft = window.innerWidth - modalWidth - 16;
      const finalRight = Math.min(adjustedRight, window.innerWidth - 16);
      
      // 設置彈窗位置樣式
      modalContent.style.position = 'fixed';
      modalContent.style.right = `${finalRight}px`;
      modalContent.style.bottom = `${adjustedBottom}px`;
      modalContent.style.left = 'auto';
      modalContent.style.top = 'auto';
      modalContent.style.transform = 'none';
      
      // 添加對話框樣式的動畫
      modalContent.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      // 設置初始狀態（縮小並偏移）
      modalContent.style.transform = 'scale(0.7) translateY(20px)';
      
      // 延遲設置顯示狀態
      setTimeout(() => {
        modalContent.style.transform = 'scale(1) translateY(0)';
      }, 50);
    }
    
    // 隱藏背景遮罩和關閉按鈕（對話框模式）
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
    if (closeBtn) {
      closeBtn.style.setProperty('display', 'none', 'important');
    }
    
    // 設置 modal-container 為 pointer-events: none，讓點擊事件穿透到下面的元素
    const modalContainer = this._modal.shadowRoot?.querySelector('#modal-container');
    if (modalContainer) {
      modalContainer.style.pointerEvents = 'none';
    }
    
    // 但保持 modal-content 可以接收點擊事件
    if (modalContent) {
      modalContent.style.pointerEvents = 'auto';
    }
  }
  
  // 設置對話框模式的 pointer-events
  _setDialogMode() {
    if (!this._modal) return;
    
    const modalContainer = this._modal.shadowRoot?.querySelector('#modal-container');
    if (modalContainer) {
      modalContainer.classList.add('dialog-mode');
    }
    
    // 給 Modal 組件本身添加對話框模式類別
    this._modal.classList.add('dialog-mode');
  }

  // 為 LeftDown 位置配置彈窗
  _configureModalForLeftDown() {
    if (!this._modal) return;

    // 獲取按鈕的位置
    const button = this.shadowRoot.querySelector('.ai-pd-container__trigger');
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const modalContent = this._modal.shadowRoot?.querySelector('#modal-content');
    const modalOverlay = this._modal.shadowRoot?.querySelector('#modal-overlay');
    const closeBtn = this._modal.shadowRoot?.querySelector('#close-btn');
    
    if (modalContent) {
      // 計算彈窗應該顯示的位置
      // 彈窗顯示在按鈕上方 20px，左側對齊按鈕左側
      const modalWidth = 480; // 彈窗寬度
      const modalHeight = 480; // 彈窗高度
      const buttonWidth = buttonRect.width;
      const buttonHeight = buttonRect.height;
      
      // 計算彈窗位置
      const modalLeft = buttonRect.left; // 左側對齊按鈕左側
      const modalBottom = window.innerHeight - buttonRect.top + 20; // 按鈕上方 20px
      
      // 確保彈窗不會超出視窗邊界
      const adjustedLeft = Math.max(16, modalLeft); // 最小左邊距 16px
      const adjustedBottom = Math.max(16, modalBottom); // 最小下邊距 16px
      
      // 如果彈窗會超出右邊界，調整位置
      const maxRight = window.innerWidth - modalWidth - 16;
      const finalLeft = Math.min(adjustedLeft, maxRight);
      
      // 設置彈窗位置樣式
      modalContent.style.position = 'fixed';
      modalContent.style.left = `${finalLeft}px`;
      modalContent.style.bottom = `${adjustedBottom}px`;
      modalContent.style.right = 'auto';
      modalContent.style.top = 'auto';
      modalContent.style.transform = 'none';
      
      // 添加對話框樣式的動畫
      modalContent.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      // 設置初始狀態（縮小並偏移）
      modalContent.style.transform = 'scale(0.7) translateY(20px)';
      
      // 延遲設置顯示狀態
      setTimeout(() => {
        modalContent.style.transform = 'scale(1) translateY(0)';
      }, 50);
    }
    
    // 隱藏背景遮罩和關閉按鈕（對話框模式）
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
    if (closeBtn) {
      closeBtn.style.setProperty('display', 'none', 'important');
    }
    
    // 設置 modal-container 為 pointer-events: none，讓點擊事件穿透到下面的元素
    const modalContainer = this._modal.shadowRoot?.querySelector('#modal-container');
    if (modalContainer) {
      modalContainer.style.pointerEvents = 'none';
    }
    
    // 但保持 modal-content 可以接收點擊事件
    if (modalContent) {
      modalContent.style.pointerEvents = 'auto';
    }
  }

  // 隱藏組件
  hide() {
    // 隱藏浮動按鈕
    this.style.display = 'none';
    
    // 如果彈窗開啟，也關閉彈窗
    if (this._modal && this._modal.visible) {
      this._modal.hide();
    }
    
    // 觸發隱藏事件
    this.dispatchEvent(new CustomEvent('inf-marketing-float-button-hide'));
  }

  // 顯示組件
  show() {
    // 檢查時間有效性
    if (this.isValidTimeRange()) {
      this.style.display = 'block';
      // 載入智慧選物：僅頁面首次顯示漂浮鈕時送出（顯示／隱藏切換不重複計）
      if (!this._hasTrackedFloatLoad) {
        this._hasTrackedFloatLoad = true;
        this._trackFloatGa4('float_button_load', 'float_load', 'load');
      }
      // 觸發顯示事件
      this.dispatchEvent(new CustomEvent('inf-marketing-float-button-show'));
    }
  }
}

if (!customElements.get('inf-marketing-floating-button')) {
  customElements.define('inf-marketing-floating-button', InfMarketingFloatButtonComponent);
}

// ==================== 管理器組件 ====================

/**
 * 選物進度：存於父站 localStorage（各電商站互不干擾；同品牌同站可續選／保留釘選）
 */
var InfSelectionProgress = (function () {
    // 內嵌與 iframe 相同的 SelectionProgressStore（單一快照＋跨分頁鎖定）
/**
 * 選物進度儲存引擎（純邏輯，可在 Node / Browser 共用）
 *
 * 唯一真相：INFS_SELECTION_{brand}_{route}
 * 跨分頁規則：status=completed 後忽略 answer，直到 clear
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SelectionProgressStore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var PROTOCOL_V = 2;
  var SNAP_PREFIX = "INFS_SELECTION_";
  var LEGACY = {
    order: "INFS_ROUTE_ORDER_",
    res: "INFS_ROUTE_RES_",
    shown: "INFS_SHOWN_",
  };

  function createMemoryStorage() {
    var map = {};
    return {
      getItem: function (k) {
        return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
      },
      setItem: function (k, v) {
        map[k] = String(v);
      },
      removeItem: function (k) {
        delete map[k];
      },
    };
  }

  function safeParse(raw, fallback) {
    try {
      if (raw == null || raw === "") return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function snapKey(brand, routeId) {
    return SNAP_PREFIX + brand + "_" + routeId;
  }

  function hasUsableResult(result) {
    if (!result || typeof result !== "object") return false;
    if (Array.isArray(result.Item) && result.Item.length > 0) return true;
    if (result.pools && typeof result.pools === "object") {
      return Object.keys(result.pools).some(function (k) {
        return Array.isArray(result.pools[k]) && result.pools[k].length > 0;
      });
    }
    return false;
  }

  function isAnsweredTagList(list) {
    return (
      Array.isArray(list) &&
      list.length > 0 &&
      list[0] &&
      list[0].Name &&
      list[0].Name !== "example"
    );
  }

  function countAnswered(record) {
    if (!record || typeof record !== "object") return 0;
    var n = 0;
    Object.keys(record).forEach(function (k) {
      if (isAnsweredTagList(record[k])) n += 1;
    });
    return n;
  }

  function mergeRecord(previous, incoming) {
    var out = {};
    var prev = previous && typeof previous === "object" ? previous : {};
    var next = incoming && typeof incoming === "object" ? incoming : {};
    Object.keys(prev).forEach(function (k) {
      out[k] = prev[k];
    });
    Object.keys(next).forEach(function (k) {
      if (isAnsweredTagList(next[k])) {
        out[k] = next[k];
      } else if (!Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] = next[k];
      }
    });
    return out;
  }

  function cloneJson(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return null;
    }
  }

  function normalizeAction(data) {
    if (!data || typeof data !== "object") return "answer";
    if (data.action === "clear" || data.status === "cleared") return "clear";
    if (data.action === "complete" || data.status === "completed") {
      return "complete";
    }
    return "answer";
  }

  function create(options) {
    var storage =
      (options && options.storage) ||
      (typeof localStorage !== "undefined" ? localStorage : createMemoryStorage());

    function readRaw(key) {
      try {
        return storage.getItem(key);
      } catch (e) {
        return null;
      }
    }

    function writeRaw(key, value) {
      try {
        storage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    }

    function removeRaw(key) {
      try {
        storage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    }

    function readList(prefix, brand) {
      var parsed = safeParse(readRaw(prefix + brand), []);
      return Array.isArray(parsed) ? parsed : [];
    }

    function findByRoute(list, routeId) {
      if (!Array.isArray(list) || !routeId) return null;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].Route) === String(routeId)) return list[i];
      }
      return null;
    }

    function readSnap(brand, routeId) {
      if (!brand || !routeId) return null;
      var parsed = safeParse(readRaw(snapKey(brand, routeId)), null);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    }

    function writeSnap(brand, routeId, snap) {
      if (!brand || !routeId || !snap) return false;
      var payload = cloneJson(snap) || snap;
      payload.Route = String(routeId);
      payload.v = PROTOCOL_V;
      payload.updatedAt = Date.now();
      return writeRaw(snapKey(brand, routeId), JSON.stringify(payload));
    }

    function clearAllKeys(brand, routeId) {
      removeRaw(snapKey(brand, routeId));
      removeRaw(LEGACY.shown + brand + "_" + routeId);
      // 清 legacy list 內同 Route
      ["order", "res"].forEach(function (which) {
        var prefix = which === "res" ? LEGACY.res : LEGACY.order;
        var list = readList(prefix, brand).filter(function (item) {
          return !(item && String(item.Route) === String(routeId));
        });
        writeRaw(prefix + brand, JSON.stringify(list));
      });
    }

    function migrateLegacy(brand, routeId) {
      var existing = readSnap(brand, routeId);
      if (existing) return existing;

      var orderItem = findByRoute(readList(LEGACY.order, brand), routeId);
      var resItem = findByRoute(readList(LEGACY.res, brand), routeId);
      var shown = safeParse(readRaw(LEGACY.shown + brand + "_" + routeId), null);
      var base = resItem || orderItem;
      if (!base && !hasUsableResult(shown)) return null;

      var result =
        (hasUsableResult(shown) && shown) ||
        (base && hasUsableResult(base.Result) && base.Result) ||
        null;
      var record = (base && base.Record) || {};
      var status =
        hasUsableResult(result) || countAnswered(record) > 0
          ? hasUsableResult(result)
            ? "completed"
            : resItem
              ? "completed"
              : "in_progress"
          : "in_progress";
      if (hasUsableResult(result)) status = "completed";

      var snap = {
        Route: routeId,
        TagGroups_order: (base && base.TagGroups_order) || [],
        Record: record,
        Pinned: (base && base.Pinned) || {},
        Result: result,
        status: status,
        v: PROTOCOL_V,
      };
      writeSnap(brand, routeId, snap);
      return snap;
    }

    function toRestore(snap, routeId) {
      if (!snap) return null;
      return {
        Route: snap.Route || routeId,
        TagGroups_order: snap.TagGroups_order || [],
        Record: snap.Record || {},
        Pinned: snap.Pinned || {},
        Result: snap.Result || null,
        status: snap.status || "in_progress",
        v: snap.v || PROTOCOL_V,
        updatedAt: snap.updatedAt || 0,
      };
    }

    function get(brand, routeId) {
      if (!brand || !routeId) return null;
      var snap = readSnap(brand, routeId) || migrateLegacy(brand, routeId);
      return toRestore(snap, routeId);
    }

    function apply(data) {
      if (!data || data.type !== "selection_progress") {
        return { ok: false, reason: "invalid_type" };
      }
      var brand = data.brand;
      var routeId = data.route;
      if (!brand || !routeId) return { ok: false, reason: "missing_ids" };

      var action = normalizeAction(data);
      if (action === "clear") {
        clearAllKeys(brand, routeId);
        return { ok: true, action: "clear" };
      }

      var prev = readSnap(brand, routeId) || migrateLegacy(brand, routeId);

      // 完成態鎖定：任何分頁的 answer 都不可覆寫
      if (prev && prev.status === "completed" && action === "answer") {
        return { ok: true, action: "ignored_locked", restore: toRestore(prev, routeId) };
      }

      var incomingResult = Object.prototype.hasOwnProperty.call(data, "result")
        ? data.result
        : Object.prototype.hasOwnProperty.call(data, "Result")
          ? data.Result
          : null;

      var mergedRecord = mergeRecord(prev && prev.Record, data.record || data.Record);
      var mergedResult = hasUsableResult(incomingResult)
        ? cloneJson(incomingResult) || incomingResult
        : prev && hasUsableResult(prev.Result)
          ? prev.Result
          : null;
      var mergedPinned = Object.assign(
        {},
        (prev && prev.Pinned) || {},
        data.pinned || data.Pinned || {}
      );
      var tagGroupsOrder =
        data.tagGroupsOrder ||
        data.TagGroups_order ||
        (prev && prev.TagGroups_order) ||
        [];

      var nextStatus = action === "complete" ? "completed" : "in_progress";
      if (hasUsableResult(mergedResult)) nextStatus = "completed";

      if (
        nextStatus === "completed" &&
        countAnswered(mergedRecord) === 0 &&
        prev &&
        countAnswered(prev.Record) > 0
      ) {
        mergedRecord = prev.Record;
      }

      // complete 必須有 Result；沒有就拒絕（避免寫入空完成態）
      if (action === "complete" && !hasUsableResult(mergedResult)) {
        return { ok: false, reason: "complete_without_result" };
      }

      var snap = {
        Route: routeId,
        TagGroups_order: tagGroupsOrder,
        Record: mergedRecord,
        Pinned: mergedPinned,
        Result: mergedResult,
        status: nextStatus,
        v: PROTOCOL_V,
      };
      var written = writeSnap(brand, routeId, snap);
      if (!written) return { ok: false, reason: "write_failed" };
      return { ok: true, action: action, restore: toRestore(snap, routeId) };
    }

    return {
      PROTOCOL_V: PROTOCOL_V,
      snapKey: snapKey,
      hasUsableResult: hasUsableResult,
      get: get,
      apply: apply,
      clear: function (brand, routeId) {
        return apply({
          type: "selection_progress",
          action: "clear",
          brand: brand,
          route: routeId,
        });
      },
    };
  }

  return {
    PROTOCOL_V: PROTOCOL_V,
    create: create,
    createMemoryStorage: createMemoryStorage,
    hasUsableResult: hasUsableResult,
    mergeRecord: mergeRecord,
    normalizeAction: normalizeAction,
  };
});

    var store = SelectionProgressStore.create({
        storage: typeof localStorage !== 'undefined' ? localStorage : SelectionProgressStore.createMemoryStorage()
    });

    function getRestore(brand, routeId) {
        return store.get(brand, routeId);
    }

    function attachRestore(payload) {
        if (!payload || typeof payload !== 'object') return payload;
        var restore = store.get(payload.brand || '', payload.id || '');
        if (restore) payload.selection_restore = restore;
        else delete payload.selection_restore;
        return payload;
    }

    function handleMessage(data) {
        store.apply(data);
    }

    if (typeof window !== 'undefined' && !window.__INFS_SELECTION_PROGRESS_BOUND__) {
        window.__INFS_SELECTION_PROGRESS_BOUND__ = true;
        window.addEventListener('message', function (event) {
            try {
                if (event.data && event.data.type === 'selection_progress') {
                    handleMessage(event.data);
                }
            } catch (e) {
                console.warn('InfSelectionProgress listener 錯誤:', e);
            }
        });
    }

    return {
        getRestore: getRestore,
        attachRestore: attachRestore,
        handleMessage: handleMessage,
        _store: store
    };
})();


/**
 * 從 localStorage 讀取訪客／會員識別（GVID / LGVID / MRID）
 * @returns {{MRID: string, GVID: string, LGVID: string}}
 */
function readVisitorIdsFromLocalStorage() {
    var result = { MRID: '', GVID: '', LGVID: '' };
    try {
        if (typeof localStorage === 'undefined') return result;
        var mrid = localStorage.getItem('MRID');
        var gvid = localStorage.getItem('GVID');
        var lgvid = localStorage.getItem('LGVID');
        if (mrid) result.MRID = String(mrid);
        if (gvid) result.GVID = String(gvid);
        if (lgvid) result.LGVID = String(lgvid);
    } catch (e) {
        // localStorage 不可用（隱私模式等）時略過
    }
    return result;
}

/**
 * 將 ga 後綴附加到 iframe_container_module.html URL
 * @param {string} url
 * @param {string} ga  - Measurement ID（如 'G-XXXX'）或 '?ga=G-XXXX' / 'ga=G-XXXX'
 * @returns {string}
 */
function appendIframeGaSuffix(url, ga) {
    if (!url || !ga) return url;

    var measurementId = resolveGaMeasurementId(ga);
    var gaQuery = measurementId
        ? ('ga=' + encodeURIComponent(measurementId))
        : (ga.startsWith('?') || ga.startsWith('&') ? ga.replace(/^[?&]/, '') : ga);

    // 已有 ga 參數則不重複附加
    if (/[?&]ga=/.test(url)) return url;

    return url.replace(/(iframe_container_module\.html)([?#].*)?$/, function (match, filename, rest) {
        if (!rest) {
            return filename + '?' + gaQuery;
        }
        if (rest.charAt(0) === '?') {
            // 保留既有 query（如 ?v=v1），再附加 ga
            return filename + rest + '&' + gaQuery;
        }
        // rest 以 # 開頭：先加 query 再接 hash
        return filename + '?' + gaQuery + rest;
    });
}

/**
 * 正規化 iframe UI 語系（對齊 ts-iframe-no-media NoMediaI18n）
 * @param {string} [lang]
 * @returns {null|'zh-TW'|'en'}
 */
function normalizeIframeLang(lang) {
    if (lang == null || String(lang).trim() === '') return null;
    return getParentUiLang(lang);
}

/**
 * 從 options.ga 解析 Measurement ID（支援 'G-XXXX'、'?ga=G-XXXX'、'ga=G-XXXX'）
 * @param {string} ga
 * @returns {string}
 */
function resolveGaMeasurementId(ga) {
    if (!ga || typeof ga !== 'string') return '';
    var trimmed = ga.trim();
    var queryMatch = trimmed.match(/(?:^|[?&])ga=([^&]*)/i);
    if (queryMatch) return decodeURIComponent(queryMatch[1]);
    if (/^G-[A-Z0-9]+$/i.test(trimmed)) return trimmed;
    return '';
}

/**
 * 在外層頁面載入 gtag（有傳 ga 才執行）
 * @param {string} ga
 */
function ensureOuterGtag(ga) {
    var measurementId = resolveGaMeasurementId(ga);
    if (!measurementId) return;
    if (window.__infMarketingGtagId === measurementId) return;

    window.__infMarketingGtagId = measurementId;
    window.GA_MEASUREMENT_ID = measurementId;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function () { window.dataLayer.push(arguments); };
    }
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"][src*="' + measurementId + '"]')) {
        var gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        document.head.appendChild(gtagScript);
    }
}

/**
 * 外層 GA4 事件前綴（對齊各版 iframe）
 * - media（有媒體）→ media_
 * - nomedia-v2（拉霸）→ no-media_v2_
 * - nomedia / v1（列表）→ no-media_
 */
var INF_MARKETING_GA_PREFIX_MEDIA = 'media_';
var INF_MARKETING_GA_PREFIX_V1 = 'no-media_';
var INF_MARKETING_GA_PREFIX_V2 = 'no-media_v2_';

/**
 * 收集目前可用的 iframe URL 候選
 * @returns {string[]}
 */
function collectInfMarketingIframeUrls() {
    var urlCandidates = [];
    try {
        var manager = window.infMarketingManager;
        if (manager) {
            if (manager.currentComponent && manager.currentComponent.modalIframeUrl) {
                urlCandidates.push(String(manager.currentComponent.modalIframeUrl));
            }
            if (manager.modal) {
                if (manager.modal.iframeUrl) {
                    urlCandidates.push(String(manager.modal.iframeUrl));
                }
                if (manager.modal.currentIframeUrl) {
                    urlCandidates.push(String(manager.modal.currentIframeUrl));
                }
            }
        }
        var modal = document.querySelector('inf-marketing-modal')
            || document.querySelector('#inf-smart-selection-modal')
            || document.querySelector('#infMarketingModal');
        if (modal) {
            if (modal.iframeUrl) urlCandidates.push(String(modal.iframeUrl));
            if (modal.currentIframeUrl) urlCandidates.push(String(modal.currentIframeUrl));
        }
    } catch (e) {
        // ignore
    }
    return urlCandidates;
}

/**
 * 取得外層 GA4 事件前綴（依目前 iframe 版本）
 * @returns {string}
 */
function resolveInfMarketingGaPrefix() {
    try {
        var manager = window.infMarketingManager;
        var mode = manager && manager.route ? manager.route.RouteDisplayMode : '';
        if (mode === 'media') return INF_MARKETING_GA_PREFIX_MEDIA;
        if (mode === 'nomedia-v2') return INF_MARKETING_GA_PREFIX_V2;

        var urls = collectInfMarketingIframeUrls();
        for (var i = 0; i < urls.length; i++) {
            var url = urls[i];
            // media 版網域／路徑特徵
            if (/ts-iframe-v2\.vercel\.app/i.test(url) && !/no-media/i.test(url)) {
                return INF_MARKETING_GA_PREFIX_MEDIA;
            }
            if (/[?&]v=v2(?:&|#|$)/.test(url)) return INF_MARKETING_GA_PREFIX_V2;
            if (/[?&]v=v1(?:&|#|$)/.test(url)) return INF_MARKETING_GA_PREFIX_V1;
        }
    } catch (e) {
        // ignore
    }
    return INF_MARKETING_GA_PREFIX_V1;
}

/**
 * 外層 GA4 事件發送（各元件入口共用）
 * @param {string} eventAction - gtag event 短名或已含前綴的完整名稱
 * @param {Object} [detail]
 * @param {string} [detail.brand]
 * @param {string} [detail.route]
 * @param {string} [detail.event_category]
 * @param {string} [detail.event_label]
 * @param {string} [detail.action]
 * @param {number} [detail.value]
 * @param {string} [detail.measurementId]
 * @param {Object} [detail.extra] - 額外自訂參數
 */
function trackInfMarketingGa4(eventAction, detail) {
    try {
        if (!eventAction) return;
        detail = detail || {};
        var prefix = resolveInfMarketingGaPrefix();
        var raw = String(eventAction);
        var fullEventName = raw;
        // 已含任一版前綴則不再疊加
        if (
            raw.indexOf(INF_MARKETING_GA_PREFIX_MEDIA) !== 0
            && raw.indexOf(INF_MARKETING_GA_PREFIX_V2) !== 0
            && raw.indexOf(INF_MARKETING_GA_PREFIX_V1) !== 0
        ) {
            fullEventName = prefix + raw;
        }
        var measurementId = resolveGaMeasurementId(
            detail.measurementId || window.GA_MEASUREMENT_ID || ''
        );

        if (measurementId) {
            ensureOuterGtag(measurementId);
        }
        if (typeof window.gtag !== 'function') return;

        var gaPayload = {
            event_category: detail.event_category || 'inffits_route',
            event_label: detail.event_label || '',
            value: typeof detail.value === 'number' ? detail.value : 1,
            action: detail.action || '',
            brand: detail.brand || '',
            route: detail.route || ''
        };
        if (measurementId) {
            gaPayload.send_to = measurementId;
        }
        if (detail.extra && typeof detail.extra === 'object') {
            Object.keys(detail.extra).forEach(function (key) {
                if (detail.extra[key] != null) {
                    gaPayload[key] = detail.extra[key];
                }
            });
        }
        window.gtag('event', fullEventName, gaPayload);
    } catch (e) {
        console.warn('GA4 事件發送失敗:', eventAction, e);
    }
}

/**
 * 監聽 iframe postMessage（header: GA4Event），轉發至父頁 gtag
 * 契約對齊 no-media-v2 / shirt-component.js
 * iframe 不直接呼叫 gtag，只帶 utm_*；父頁需映射為 campaign_* 再送出
 */
function ensureInfMarketingGa4EventListener() {
    if (window.__infMarketingGa4EventListenerBound) return;
    window.__infMarketingGa4EventListenerBound = true;

    var utmToCampaign = {
        utm_source: 'campaign_source',
        utm_medium: 'campaign_medium',
        utm_campaign: 'campaign_name',
        utm_term: 'campaign_term',
        utm_content: 'campaign_content'
    };

    window.addEventListener('message', function (event) {
        var data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.header !== 'GA4Event') return;
        if (!data.event_action) return;

        var gaPayload = {
            event_category: data.event_category || 'inffits_route',
            event_label: data.event_label || '',
            value: typeof data.value === 'number' ? data.value : 1
        };

        if (data.action != null) gaPayload.action = data.action;
        if (data.brand != null) gaPayload.brand = data.brand;
        if (data.route != null) gaPayload.route = data.route;
        if (data.tag_group != null) gaPayload.tag_group = data.tag_group;
        if (data.step != null) gaPayload.step = data.step;
        if (data.from_group != null) gaPayload.from_group = data.from_group;
        if (data.to_group != null) gaPayload.to_group = data.to_group;
        if (data.event_value != null) gaPayload.event_value = data.event_value;

        // utm_* → campaign_*（gtag 不接受直接傳 utm_*）
        Object.keys(utmToCampaign).forEach(function (utmKey) {
            if (data[utmKey]) {
                gaPayload[utmToCampaign[utmKey]] = data[utmKey];
            }
        });

        var measurementId = resolveGaMeasurementId(data.measurement_id || window.GA_MEASUREMENT_ID || '');
        if (measurementId) {
            gaPayload.send_to = measurementId;
            ensureOuterGtag(measurementId);
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', data.event_action, gaPayload);
        }
    });
}

// 腳本載入後即掛上 listener（不依賴 initInfMarketing）
ensureInfMarketingGa4EventListener();

/**
 * INF marketing component管理器
 * 負責整合所有營銷組件的載入和管理功能
 */
class InfMarketingComponentManager {
    constructor() {
        this.config = null;
        this.route = null;
        this.availableRoutes = [];
        this.currentComponent = null;
        this.modal = null;
        this.isInitialized = false;
        this.brand = null;
        this.iframeParams = {};

        this.init = this.init.bind(this);
        this.fetchMarketingData = this.fetchMarketingData.bind(this);
        this.loadComponent = this.loadComponent.bind(this);
        this.handleComponentClose = this.handleComponentClose.bind(this);
    }

    /**
     * 初始化組件管理器
     * @param {string} brand - 品牌名稱（必填）
     * @param {string} [url] - 網址（可選，預設使用當前頁面網址）
     * @param {Object} [config] - 自定義配置（可選，當 API 回傳的 config 為空時使用）
     * @param {Object} [iframeParams] - iframe 參數（可選）
     */
    async init(brand, url, config, iframeParams) {
        if (this.isInitialized) {
            return;
        }
        if (!brand || typeof brand !== 'string' || !brand.trim()) {
            console.error('初始化失敗：brand 參數為必填且不可為空');
            return;
        }
        try {
            this.brand = brand;
            this.iframeParams = iframeParams || {};

            // 如果沒有提供 url，使用當前頁面網址
            const targetUrl = url || window.location.href;
            const data = await this.fetchMarketingData(brand, targetUrl);
            this.availableRoutes = Array.isArray(data?.route) ? data.route : [];
            const routeId = (this.iframeParams && this.iframeParams.route_id) ? String(this.iframeParams.route_id).trim() : '';

            // 未指定 route_id 時，仍需 API 回傳的動線
            if (!routeId && (!data || !data.route || data.route.length === 0)) {
                console.warn('未取得有效的營銷資料');
                return;
            }

            if (!data.config?.Banner_Info?.[0] && config) {
                this.config = config;
            } else if (data.config?.Banner_Info?.[0]) {
                this.config = data.config.Banner_Info[0];
            } else {
                console.warn('未取得有效的配置資料');
                return;
            }

            // 有指定 route_id：打 run_routeproduct，以回傳的 Product 作為動線
            if (routeId) {
                const routeProduct = await this.fetchRouteProduct(brand, routeId);
                if (!routeProduct?.Product) {
                    console.warn('未取得有效的 run_routeproduct Product 資料');
                    return;
                }
                this.route = routeProduct.Product;
            } else {
                this.route = data.route[0];
            }

            if (!this.config.status) {
                // console.log('組件狀態為關閉，不顯示', this.config);
                
                window.dispatchEvent(new CustomEvent('infMarketingConfigReady', {
                    detail: {
                        brand: this.brand,
                        config: this.config,
                        status: 'disabled',
                        message: '組件狀態為關閉'
                    }
                }));
                
                this.isInitialized = true;
                return;
            }

            // 檢查時間有效性
            if (!this.isValidTimeRange()) {
                // console.log('組件不在有效時間範圍內，不顯示', this.config);
                
                window.dispatchEvent(new CustomEvent('infMarketingConfigReady', {
                    detail: {
                        brand: this.brand,
                        config: this.config,
                        status: 'time_invalid',
                        message: '組件不在有效時間範圍內'
                    }
                }));
                
                this.isInitialized = true;
                return;
            }

            await this.loadComponent();

            this.isInitialized = true;

        } catch (error) {
            console.error('InfMarketingComponentManager 初始化失敗:', error);
            
            window.dispatchEvent(new CustomEvent('infMarketingConfigError', {
                detail: {
                    brand: this.brand,
                    error: error.message,
                    config: this.config
                }
            }));
        }
    }

    /**
     * 檢查時間有效性
     * @returns {boolean} 是否在有效時間範圍內
     */
    isValidTimeRange() {
        if (!this.config.TimeValid) {
            return true; // 如果沒有設定時間限制，則視為有效
        }

        let startDate, endDate;

        // 處理字串格式 "2025-07-23~2025-08-01"
        if (typeof this.config.TimeValid === 'string') {
            const parts = this.config.TimeValid.split('~');
            if (parts.length === 2) {
                startDate = new Date(parts[0]);
                endDate = new Date(parts[1]);
            } else {
                return true; // 格式不正確，視為有效
            }
        }
        // 處理陣列格式 ["2025-07-23", "2025-08-01"]
        else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
            startDate = new Date(this.config.TimeValid[0]);
            endDate = new Date(this.config.TimeValid[1]);
        }
        else {
            return true; // 格式不正確，視為有效
        }

        // 檢查日期是否有效
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('TimeValid 日期格式無效:', this.config.TimeValid);
            return true; // 日期無效，視為有效
        }

        // 只比較日期部分，不考慮時間
        const now = new Date();
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        return nowDate >= startDateOnly && nowDate <= endDateOnly;
    }

    async fetchMarketingData(brand, url) {
        try {
            const currentUrl = decodeURI(document.location.href.split('//')[1].toLowerCase())

            const requestData = {
                Brand: brand,
                url: url && typeof url === 'string' && url.trim() ? url : currentUrl
            };

            const response = await fetch('https://api.inffits.com/httpmpi/mkt_products_involve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('取得資料失敗:', error);
            throw error;
        }
    }

    /**
     * 依 Brand、Route 取得 run_routeproduct 動線資料
     * @param {string} brand - 品牌名稱
     * @param {string} routeId - 動線 ID
     * @returns {Promise<{RouteConfig?: Array, Product?: Object}|null>}
     */
    async fetchRouteProduct(brand, routeId) {
        try {
            const params = new URLSearchParams({
                Brand: brand,
                Route: routeId
            });
            const response = await fetch(
                `https://xjsoc4o2ci.execute-api.ap-northeast-1.amazonaws.com/v0/extension/run_routeproduct?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`run_routeproduct 請求失敗: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('取得 run_routeproduct 資料失敗:', error);
            throw error;
        }
    }

    /**
     * 依動線物件取得 iframe URL
     * @param {Object} route - 動線物件
     * @returns {string}
     */
    getRouteIframeUrl(route) {
        if (!route) return '';
        const baseIframeUrl = route.RouteDisplayMode === 'media' ?
            'https://ts-iframe-v2.vercel.app/iframe_container_module.html':
            route.RouteDisplayMode === 'nomedia-v2' ?'https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v2':
            'https://ts-iframe-no-media-git-feature-ve-1140cc-meis-projects-cf7f7626.vercel.app/iframe_container_module.html?v=v1';
        let url = appendIframeGaSuffix(baseIframeUrl, this.iframeParams?.ga || '');
        if (route.Route) {
            const ridParam = 'rid=' + encodeURIComponent(route.Route);
            url += (url.indexOf('?') >= 0 ? '&' : '?') + ridParam;
        }
        return url;
    }

    /**
     * 組裝傳入 iframe 的設定物件
     * @returns {Object}
     */
    getIframeConfigPayload() {
        var visitorIds = (typeof readVisitorIdsFromLocalStorage === 'function')
            ? readVisitorIdsFromLocalStorage()
            : { MRID: '', GVID: '', LGVID: '' };
        var payload = {
            id: this.route.Route,
            brand: this.brand,
            header: 'from_preview',
            MRID: this.iframeParams?.MRID || visitorIds.MRID || '',
            GVID: this.iframeParams?.GVID || visitorIds.GVID || '',
            LGVID: this.iframeParams?.LGVID || visitorIds.LGVID || '',
            show_origin_price: this.iframeParams?.show_origin_price === true,
            use_route_linked_tags: this.iframeParams?.use_route_linked_tags === true,
            intro_mode: (this.iframeParams?.intro_mode === 'v1' || this.iframeParams?.intro_mode === 'v2')
                ? this.iframeParams.intro_mode
                : null,
            enable_guide: this.iframeParams?.enable_guide === true
        };
        if (Object.prototype.hasOwnProperty.call(this.iframeParams || {}, 'lang')) {
            var normalizedLang = normalizeIframeLang(this.iframeParams.lang);
            if (normalizedLang) payload.lang = normalizedLang;
        }
        if (typeof InfSelectionProgress !== 'undefined' && InfSelectionProgress.attachRestore) {
            InfSelectionProgress.attachRestore(payload);
        }
        return payload;
    }

    /**
     * 切換動線並更新 modal／浮動鈕
     * @param {string} routeId - 動線 ID
     * @returns {Promise<boolean>}
     */
    async switchRoute(routeId) {
        if (!routeId || !this.brand) return false;
        try {
            const routeProduct = await this.fetchRouteProduct(this.brand, routeId);
            if (!routeProduct?.Product) {
                console.warn('switchRoute: 未取得有效的 Product 資料');
                return false;
            }
            this.route = routeProduct.Product;
            const iframeUrl = this.getRouteIframeUrl(this.route);

            if (this.currentComponent) {
                this.currentComponent.setAttribute('iframe-id', this.route.Route);
                this.currentComponent.setAttribute('multi-route-selected', this.route.Route || '');
                if (typeof this.currentComponent.setModalIframeUrl === 'function') {
                    this.currentComponent.setModalIframeUrl(iframeUrl);
                }
            }

            if (this.modal) {
                if (this.modal.setIframeConfig) {
                    this.modal.setIframeConfig(this.getIframeConfigPayload());
                }
                if (this.modal.setIframeUrl) {
                    this.modal.setIframeUrl(iframeUrl);
                }
            }

            return true;
        } catch (error) {
            console.error('switchRoute 失敗:', error);
            return false;
        }
    }

    async loadComponent() {
        const bannerType = this.config.BannerType;
        let componentTagName = '';

        switch (bannerType) {
            case 'TinyPopupBanner':
                componentTagName = 'inf-marketing-popup-banner';
                break;
            case 'SquareCardBanner':
                componentTagName = 'inf-marketing-square-card-banner';
                break;
            case 'FloatButton':
                componentTagName = 'inf-marketing-floating-button';
                break;
            default:
                console.warn(`未知的 BannerType: ${bannerType}`);
                return;
        }

        try {
            await this.waitForCustomElement(componentTagName);
            await this.createAndConfigureComponent(componentTagName);
            window.hideInfMarketing()
        } catch (error) {
            console.error('載入組件失敗:', error);
        }
    }

    waitForCustomElement(tagName) {
        return new Promise((resolve) => {
            if (customElements.get(tagName)) {
                resolve();
                return;
            }

            const checkInterval = setInterval(() => {
                if (customElements.get(tagName)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    async createAndConfigureComponent(componentTagName) {
        // 檢查使用者是否選擇了「今日不再顯示」
        const bannerType = this.getBannerType(componentTagName);
        const dontShowKey = this.getDontShowKey(bannerType);
        
        if (dontShowKey && this.shouldHideToday(dontShowKey)) {
            // console.log(`使用者選擇了今日不再顯示 ${bannerType}，跳過組件創建`);
            return;
        }

        if (this.currentComponent) {
            this.currentComponent.remove();
        }

        this.currentComponent = document.createElement(componentTagName);

        if (componentTagName === 'inf-marketing-popup-banner') {
            this.configurePopupBanner();
        } else if (componentTagName === 'inf-marketing-square-card-banner') {
            await this.configureSquareCardBanner();
        } else if (componentTagName === 'inf-marketing-floating-button') {
            this.configureFloatingButton();
        }

        await this.setupModalIframe();

        this.bindComponentEvents();

        document.body.appendChild(this.currentComponent);

        window.dispatchEvent(new CustomEvent('infMarketingConfigReady', {
            detail: {
                brand: this.brand,
                config: this.config,
                component: this.currentComponent
            }
        }));
    }

    _getUiLang() {
        return getParentUiLang(this.iframeParams && this.iframeParams.lang);
    }

    configurePopupBanner() {
        const lang = this._getUiLang();
        this.currentComponent.setAttribute('ui-lang', lang);
        this.currentComponent.setAttribute('position', this.config.Location || 'RightDown');
        this.currentComponent.setAttribute('title', this.config.Title || parentUiT(lang, 'banner.defaultTitle'));
        this.currentComponent.setAttribute('description', this.config.Description || parentUiT(lang, 'banner.defaultDescription'));
        this.currentComponent.setAttribute('button-text', this.config.CTA_text || parentUiT(lang, 'banner.defaultCta'));
        this.currentComponent.setAttribute('button-color', this.config.CTA_background || '#000000FF');
        this.currentComponent.setAttribute('button-text-color', this.config.CTA_color || '#FFFFFFFF');
        this.currentComponent.setAttribute('today-display-mode', this.config.TodayDisplayMode !== false ? 'true' : 'false');
        
        // 設置時間有效性驗證
        if (this.config.TimeValid) {
            if (typeof this.config.TimeValid === 'string') {
                // 如果是字串格式，直接設置
                this.currentComponent.setAttribute('time-valid', this.config.TimeValid);
            } else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
                // 如果是陣列格式，轉換為 JSON 字串
                this.currentComponent.setAttribute('time-valid', JSON.stringify(this.config.TimeValid));
            }
        }
        
        if (this.route) {
            this.currentComponent.setAttribute('iframe-id', this.route.Route);
        }
        if (this.brand) {
            this.currentComponent.setAttribute('brand', this.brand);
        }
    }

    async configureSquareCardBanner() {
        const lang = this._getUiLang();
        this.currentComponent.setAttribute('ui-lang', lang);
        this.currentComponent.setAttribute('position', this.config.Location || 'RightDown');
        this.currentComponent.setAttribute('width', '300px');
        this.currentComponent.setAttribute('height', '300px');
        this.currentComponent.setAttribute('auto-show', 'true');
        this.currentComponent.setAttribute('show-arrows', 'false');
        this.currentComponent.setAttribute('autoplay-speed', '3000');
        this.currentComponent.setAttribute('today-display-mode', this.config.TodayDisplayMode === true ? 'true' : 'false');
        
        // 設置時間有效性驗證
        if (this.config.TimeValid) {
            if (typeof this.config.TimeValid === 'string') {
                // 如果是字串格式，直接設置
                this.currentComponent.setAttribute('time-valid', this.config.TimeValid);
            } else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
                // 如果是陣列格式，轉換為 JSON 字串
                this.currentComponent.setAttribute('time-valid', JSON.stringify(this.config.TimeValid));
            }
        }
        
        if (this.route) {
            this.currentComponent.setAttribute('iframe-id', this.route.Route);
        }
        if (this.brand) {
            this.currentComponent.setAttribute('brand', this.brand);
        }

        await customElements.whenDefined('inf-marketing-square-card-banner');
        if (Array.isArray(this.config.CardOptions) && this.config.CardOptions.length > 0) {
            if (this.currentComponent.setImages) {
                this.currentComponent.setImages(this.config.CardOptions);
            }
        } else {
            const smartTitle = parentUiT(lang, 'card.smartSelection');
            const promoTitle = parentUiT(lang, 'card.officialPromo');
            const imageData = [
                {
                    image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=' + encodeURIComponent(smartTitle),
                    Title: smartTitle,
                    isSmartSelection: true,
                    url: null
                },
                {
                    image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=' + encodeURIComponent(promoTitle),
                    Title: promoTitle,
                    url: ''
                }
            ];
            if (this.currentComponent.setImages) {
                this.currentComponent.setImages(imageData);
            }
        }
    }

    configureFloatingButton() {
        this.currentComponent.setAttribute('ui-lang', this._getUiLang());
        this.currentComponent.setAttribute('position', this.config.Location || 'LeftDown');
        
        // 設置時間有效性驗證
        if (this.config.TimeValid) {
            if (typeof this.config.TimeValid === 'string') {
                // 如果是字串格式，直接設置
                this.currentComponent.setAttribute('time-valid', this.config.TimeValid);
            } else if (Array.isArray(this.config.TimeValid) && this.config.TimeValid.length >= 2) {
                // 如果是陣列格式，轉換為 JSON 字串
                this.currentComponent.setAttribute('time-valid', JSON.stringify(this.config.TimeValid));
            }
        }
        
        if (this.route) {
            this.currentComponent.setAttribute('iframe-id', this.route.Route);
        }
        if (this.brand) {
            this.currentComponent.setAttribute('brand', this.brand);
        }
        // 有傳 float_tooltip_text 才設屬性（含空字串＝隱藏對話框）；省略則用元件預設文案
        if (Object.prototype.hasOwnProperty.call(this.iframeParams || {}, 'float_tooltip_text')) {
            this.currentComponent.setAttribute(
                'float-tooltip-text',
                this.iframeParams.float_tooltip_text == null ? '' : String(this.iframeParams.float_tooltip_text)
            );
        }
        if (this.iframeParams?.enable_guide === true) {
            this.currentComponent.setAttribute('enable-guide', 'true');
        }
        if (this.iframeParams?.show_float_guide === true) {
            this.currentComponent.setAttribute('show-float-guide', 'true');
        }
        if (this.iframeParams?.enable_multi_route === true && this.availableRoutes.length > 0) {
            this.currentComponent.setAttribute('enable-multi-route', 'true');
            const specifiedRouteId = (this.iframeParams?.route_id)
                ? String(this.iframeParams.route_id).trim()
                : '';
            const defaultAiRouteId = specifiedRouteId
                || (this.route && this.route.Route ? String(this.route.Route) : '')
                || (this.availableRoutes[0] && this.availableRoutes[0].Route
                    ? String(this.availableRoutes[0].Route)
                    : '');

            const apiRoutes = this.availableRoutes
                .map((routeItem) => ({
                    route: routeItem.Route,
                    label: routeItem.Name || routeItem.Description || routeItem.Route || ''
                }))
                .filter((item) => item.route && String(item.route) !== defaultAiRouteId);

            const multiRouteList = [];
            if (defaultAiRouteId) {
                multiRouteList.push({
                    route: defaultAiRouteId,
                    isAiRoute: true
                });
            }
            multiRouteList.push(...apiRoutes);

            this.currentComponent.setAttribute('multi-route-list', JSON.stringify(multiRouteList));
            const selectedRouteId = (this.route && this.route.Route)
                ? String(this.route.Route)
                : defaultAiRouteId;
            if (selectedRouteId) {
                this.currentComponent.setAttribute('multi-route-selected', selectedRouteId);
            }
        }
    }

    async setupModalIframe() {
        if (!this.route) return;

        const iframeUrl = this.getRouteIframeUrl(this.route);
        
        if (this.currentComponent.setModalIframeUrl) {
            this.currentComponent.setModalIframeUrl(iframeUrl);
        }

        await this.waitForCustomElement('inf-marketing-modal');

        let modal = document.querySelector('#inf-smart-selection-modal');
        if (!modal) {
            modal = document.createElement('inf-marketing-modal');
            modal.id = 'inf-smart-selection-modal';
            document.body.appendChild(modal);
            
            await this.waitForElementInDOM(modal);
        }

        modal.setAttribute('ui-lang', this._getUiLang());

        if (modal.setIframeConfig) {
            modal.setIframeConfig(this.getIframeConfigPayload());
        }

        await this.preloadIframe(modal, iframeUrl);

        this.modal = modal;
    }

    async preloadIframe(modal, iframeUrl) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('iframe 載入超時'));
            }, 60000);

            const handleIframeLoaded = (event) => {
                clearTimeout(timeout);
                modal.removeEventListener('inf-marketing-modal:iframe-loaded', handleIframeLoaded);
                modal.removeEventListener('inf-marketing-modal:iframe-error', handleIframeError);
                resolve();
            };

            const handleIframeError = (event) => {
                clearTimeout(timeout);
                modal.removeEventListener('inf-marketing-modal:iframe-loaded', handleIframeLoaded);
                modal.removeEventListener('inf-marketing-modal:iframe-error', handleIframeError);
                resolve();
            };

            modal.addEventListener('inf-marketing-modal:iframe-loaded', handleIframeLoaded);
            modal.addEventListener('inf-marketing-modal:iframe-error', handleIframeError);

            if (modal.setIframeUrl) {
                modal.setIframeUrl(iframeUrl);
            }
        });
    }

    waitForElementInDOM(element) {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node === element || (node.contains && node.contains(element))) {
                                observer.disconnect();
                                resolve();
                                return;
                            }
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            if (document.body.contains(element)) {
                observer.disconnect();
                resolve();
            }
        });
    }

    bindComponentEvents() {
        if (!this.currentComponent) return;

        this.currentComponent.addEventListener('inf-marketing-popup-banner-close', this.handleComponentClose);
        // 移除對 inf-marketing-square-card-banner-hide 事件的監聽，避免組件被意外移除
        // this.currentComponent.addEventListener('inf-marketing-square-card-banner-hide', this.handleComponentClose);

        this.currentComponent.addEventListener('inf-marketing-square-card-banner-click', (event) => {
        });

        this.currentComponent.addEventListener('inf-marketing-popup-banner-show', () => {
        });

        this.currentComponent.addEventListener('inf-marketing-square-card-banner-show', () => {
        });
    }

    handleComponentClose() {
        if (this.currentComponent) {
            this.currentComponent.remove();
            this.currentComponent = null;
        }
    }

    showComponent() {
        if (this.currentComponent && this.currentComponent.show) {
            this.currentComponent.show();
        }
    }

    hideComponent() {
        // 檢查 currentComponent 是否存在且有 hide 方法
        if (this.currentComponent && this.currentComponent.hide) {
            this.currentComponent.hide();
        } else {
            // 如果 currentComponent 不存在或沒有 hide 方法，嘗試直接隱藏所有相關組件
            // console.log('嘗試直接隱藏所有行銷組件');
            
            // 隱藏所有可能的行銷組件
            const components = document.querySelectorAll([
                'inf-marketing-popup-banner',
                'inf-marketing-square-card-banner', 
                'inf-marketing-floating-button'
            ].join(','));
            
            components.forEach(component => {
                if (component.hide && typeof component.hide === 'function') {
                    component.hide();
                } else {
                    // 如果沒有 hide 方法，直接設置 display 為 none
                    component.style.display = 'none';
                }
            });
            
            // 隱藏智慧選物彈窗
            const modal = document.querySelector('#inf-smart-selection-modal');
            if (modal && modal.hide && typeof modal.hide === 'function') {
                modal.hide();
            }
        }
    }

    destroy() {
        if (this.currentComponent) {
            this.currentComponent.remove();
        }
        if (this.modal) {
            this.modal.remove();
        }
        this.isInitialized = false;
    }

    // 獲取 banner 類型
    getBannerType(componentTagName) {
        const typeMap = {
            'inf-marketing-popup-banner': 'PopupBanner',
            'inf-marketing-square-card-banner': 'SquareCardBanner',
            'inf-marketing-floating-button': 'FloatButton'
        };
        return typeMap[componentTagName] || null;
    }

    // 獲取 localStorage key
    getDontShowKey(bannerType) {
        const keyMap = {
            'PopupBanner': 'inf-marketing-popup-dont-show',
            'SquareCardBanner': 'inf-marketing-square-card-dont-show'
        };
        return keyMap[bannerType] || null;
    }

    // 檢查是否應該隱藏
    shouldHideToday(dontShowKey) {
        const dontShowDate = localStorage.getItem(dontShowKey);
        if (!dontShowDate) {
            return false;
        }
        const today = new Date().toDateString();
        return dontShowDate === today;
    }
}

// 創建全域實例
window.infMarketingManager = new InfMarketingComponentManager();

/**
 * 手動初始化營銷組件
 * @param {string} brand - 品牌名稱（必填）
 * @param {Object} [options] - 選項（可選）
 * @param {string} [options.url] - 網址（可選，預設使用當前頁面網址）
 * @param {Object} [options.config] - 自定義配置（可選，當 API 回傳的 config 為空時使用）
 * @param {boolean} [options.once] - 是否只顯示一次
 * @param {number} [options.expireSeconds] - 過期時間（秒）
 * @param {string} [options.MRID] - MRID 參數（可選；省略則讀 localStorage.MRID）
 * @param {string} [options.GVID] - GVID 參數（可選；省略則讀 localStorage.GVID）
 * @param {string} [options.LGVID] - LGVID 參數（可選；省略則讀 localStorage.LGVID）
 * @param {string} [options.ga] - GA Measurement ID（可選，有填則外層載入 gtag，並帶入 iframe URL）
 * @param {string} [options.route_id] - 指定動線 ID（可選，有填則直接使用且 mode 固定 nomedia-v2）
 * @param {boolean} [options.show_origin_price=false] - 是否顯示原價（可選，預設 false）
 * @param {boolean} [options.use_route_linked_tags=false] - 是否開啟 RouteLinkedTags 過濾（可選，預設 false；省略或 false 則下一題仍顯示全部選項）
 * @param {null|'v1'|'v2'} [options.intro_mode=null] - 介紹模式（可選；省略或 null；合法值 'v1' / 'v2'）
 * @param {string} [options.float_tooltip_text] - 浮動鈕上方對話框文案（可選；省略用預設「來試試 infFITS 個人化推薦購物！」；空字串則不顯示對話框）
 * @param {boolean} [options.enable_guide=false] - 是否啟用遮罩引導（可選；預設 false；true 時才顯示父頁引導與 iframe 內教學）
 * @param {boolean} [options.show_float_guide=false] - 是否強制顯示浮動鈕遮罩引導（可選；需 enable_guide；true 時忽略 localStorage）
 * @param {boolean} [options.enable_multi_route=false] - 是否啟用多動線選擇（可選；預設 false；true 時浮動鈕對話框下方列出 API route 選項）
 * @param {'zh-TW'|'en'} [options.lang] - iframe UI 語系（可選；省略則 iframe 預設 zh-TW；支援 'zh-TW' / 'en' 及常見別名）
 */
window.initInfMarketing = (brand, options) => {
    // 處理參數
    if (typeof options === 'undefined') {
        options = {};
    }

    // 有傳 ga：在外層頁注入 gtag，並帶入 iframe
    if (options.ga) {
        ensureOuterGtag(options.ga);
    }
    ensureInfMarketingGa4EventListener();
    
    const url = options.url;
    const config = options.config;
    const visitorIds = readVisitorIdsFromLocalStorage();
    const iframeParams = {
        MRID: options.MRID || visitorIds.MRID || '',
        GVID: options.GVID || visitorIds.GVID || '',
        LGVID: options.LGVID || visitorIds.LGVID || '',
        ga: options.ga || '',
        route_id: options.route_id || '',
        show_origin_price: options.show_origin_price === true,
        use_route_linked_tags: options.use_route_linked_tags === true,
        intro_mode: (options.intro_mode === 'v1' || options.intro_mode === 'v2') ? options.intro_mode : null,
        enable_guide: options.enable_guide === true,
        show_float_guide: options.show_float_guide === true,
        enable_multi_route: options.enable_multi_route === true
    };
    if (Object.prototype.hasOwnProperty.call(options, 'lang')) {
        var normalizedInitLang = normalizeIframeLang(options.lang);
        if (normalizedInitLang) iframeParams.lang = normalizedInitLang;
    }
    if (Object.prototype.hasOwnProperty.call(options, 'float_tooltip_text')) {
        iframeParams.float_tooltip_text = options.float_tooltip_text == null
            ? ''
            : String(options.float_tooltip_text);
    }
    
    // 檢查使用者是否勾選了「今日不再顯示」checkbox
    var bannerType = (config && config.BannerType) ? config.BannerType : null;
    var dontShowKey = null;
    
    if (bannerType === 'PopupBanner') {
        dontShowKey = 'inf-marketing-popup-dont-show';
    } else if (bannerType === 'SquareCardBanner') {
        dontShowKey = 'inf-marketing-square-card-dont-show';
    }
    
    // 檢查使用者是否選擇了今日不再顯示
    var userDontShowToday = false;
    if (dontShowKey) {
        const dontShowDate = localStorage.getItem(dontShowKey);
        if (dontShowDate) {
            const today = new Date().toDateString();
            userDontShowToday = dontShowDate === today;
        }
    }
    
    // 如果使用者選擇了今日不再顯示，則不顯示組件
    if (userDontShowToday) {
        // console.log('使用者選擇了今日不再顯示，跳過組件初始化');
        return;
    }
    
    var once = !!options.once;
    var expireSeconds = typeof options.expireSeconds === 'number' ? options.expireSeconds : 0;

    function getLocalStorageWithExpire(key) {
        var data = localStorage.getItem(key);
        if (!data) return null;
        try {
            var obj = JSON.parse(data);
            if (obj.expireAt && Date.now() > obj.expireAt) {
                localStorage.removeItem(key);
                return null;
            }
            return obj.value;
        } catch (e) {
            localStorage.removeItem(key);
            return null;
        }
    }
    function setLocalStorageWithExpire(key, value, expireSeconds) {
        if(key.includes('FloatButton'))return
        var expireAt = expireSeconds > 0 ? Date.now() + expireSeconds * 1000 : 0;
        var data = { value: value, expireAt: expireAt };
        localStorage.setItem(key, JSON.stringify(data));
    }

    var bannerType = (config && config.BannerType) ? config.BannerType : null;
    var key = bannerType ? ('infMarketing_' + brand + '_' + bannerType + '_shown') : null;
    if (once && key && getLocalStorageWithExpire(key)) {
        // console.log('已初始化過 ' + brand + '（' + bannerType + '），不重複顯示');
        return;
    }

    if (window.infMarketingManager) {
        // 傳遞可選參數到 init 方法
        window.infMarketingManager.init(brand, url, config, iframeParams);

        // 設置 iframe 參數（如果有提供）
        if (iframeParams.MRID || iframeParams.GVID || iframeParams.LGVID || iframeParams.show_origin_price || iframeParams.use_route_linked_tags || iframeParams.intro_mode || iframeParams.enable_guide || iframeParams.lang) {
            // 等待組件載入完成後設置參數
            const setupIframeParams = () => {
                const modal = document.querySelector('inf-marketing-modal');
                if (modal) {
                    if (iframeParams.MRID) modal.setIframeMRID(iframeParams.MRID);
                    if (iframeParams.GVID) modal.setIframeGVID(iframeParams.GVID);
                    if (iframeParams.LGVID) modal.setIframeLGVID(iframeParams.LGVID);
                    if (typeof modal.setIframeShowOriginPrice === 'function') {
                        modal.setIframeShowOriginPrice(iframeParams.show_origin_price);
                    }
                    if (typeof modal.setIframeUseRouteLinkedTags === 'function') {
                        modal.setIframeUseRouteLinkedTags(iframeParams.use_route_linked_tags);
                    }
                    if (typeof modal.setIframeIntroMode === 'function') {
                        modal.setIframeIntroMode(iframeParams.intro_mode);
                    }
                    if (iframeParams.lang) {
                        modal.setAttribute('ui-lang', getParentUiLang(iframeParams.lang));
                        if (typeof modal.setIframeLang === 'function') {
                            modal.setIframeLang(iframeParams.lang);
                        }
                    }
                    
                    // 立即發送訊息到 iframe（如果 iframe 已載入）
                    const iframe = modal.shadowRoot?.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        modal.sendIframeMessage(iframe);
                    }
                }
            };
            
            // 立即嘗試設置，如果組件還沒載入則等待
            setupIframeParams();
            setTimeout(setupIframeParams, 100);
            setTimeout(setupIframeParams, 500);
            setTimeout(setupIframeParams, 1000);
        }

        if (once) {
            var handler = function(e) {
                var bannerType = (e.detail && e.detail.config && e.detail.config.BannerType) ? e.detail.config.BannerType : 'default';
                var key = 'infMarketing_' + brand + '_' + bannerType + '_shown';
                if (getLocalStorageWithExpire(key)) {
                    // 已顯示過，移除元件
                    if (window.infMarketingManager && window.infMarketingManager.currentComponent) {
                        window.infMarketingManager.currentComponent.remove();
                        window.infMarketingManager.currentComponent = null;
                    }
                    // console.log('已初始化過 ' + brand + '（' + bannerType + '），不重複顯示');
                } else {
                    setLocalStorageWithExpire(key, '1', expireSeconds > 0 ? expireSeconds : 24 * 60 * 60);
                }
                window.removeEventListener('infMarketingConfigReady', handler);
            };
            window.addEventListener('infMarketingConfigReady', handler);
        }
    } else {
        console.error('infMarketingManager 尚未載入');
    }
};

// 提供手動控制方法
window.showInfMarketing = () => {
    if (window.infMarketingManager) {
        window.infMarketingManager.showComponent();
    }
};

window.hideInfMarketing = () => {
    if (window.infMarketingManager) {
        window.infMarketingManager.hideComponent();
    }
};

// ========================================
// FindINF_ProductAI.js 整合
// ========================================

// 全局變量
var FindINF = false;
var BRAND = '';
var ecommerce = {};

// FindINF_proc 函數 - 整合自 FindINF_ProductAI.js
function FindINF_proc(Brand, ecommerce) {
    // -----------------------------
    var Brand = Brand;
    // -----------------------------

    // 生成隨機 ID 的函數
    var makeid = function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    // 監聽消息事件
    window.addEventListener('message', function (event) {
        if (event.data["MsgHeader"] == "BODYID_MSG") {
            var bodyid_from_ls = event.data["BODYID"];

            // 獲取訂單相關數據
            try {
                var order_id = window.nineyi.ServerData.payProcessData.TradesOrderGroup.TradesOrderList[0].TradesOrder_Code;
            } catch (e) {
                var order_id = 'orderid_error';
            }

            try {
                var order_id_inner = window.nineyi.ServerData.payProcessData.TradesOrderGroup.TradesOrderList[0].TradesOrder_Code;
            } catch (e) {
                var order_id_inner = 'orderid_error';
            }

            try {
                var TGCode = ecommerce.actionField.id;
            } catch (e) {
                var TGCode = 'TGCode error';
            }

            try {
                var TSCode = window.nineyi.ServerData.payProcessData.TradesOrderGroup.TradesOrderList[0].TradesOrderSlaveList.map(product => product.TradesOrderSlave_Code);
            } catch (e) {
                var TSCode = 'TSCode error';
            }

            var data = document.documentElement.innerHTML;

            // 獲取產品相關數據
            var item_id_list = [];
            try {
                item_id_list = ecommerce.products.map(product => product.id);
            } catch (e) {
                item_id_list = 'product_id_error';
            }

            var sku_id_list = [];
            try {
                sku_id_list = ecommerce.products.map(product => product.skuId);
            } catch (e) {
                sku_id_list = 'sku_id_error';
            }

            var itemname_id_list = [];
            try {
                itemname_id_list = ecommerce.products.map(product => product.name);
            } catch (e) {
                itemname_id_list = 'name error';
            }

            var dvitem_id_list = [];
            var priceitem_list = [];
            var count_list = [];

            try {
                dvitem_id_list = ecommerce.products.map(product => product.skuName);
            } catch (e) {
                dvitem_id_list = 'dvitem_id_list error';
            }

            try {
                priceitem_list = ecommerce.products.map(product => product.price);
            } catch (e) {
                priceitem_list = 'priceitem_list error';
            }

            try {
                count_list = ecommerce.products.map(product => product.quantity);
            } catch (e) {
                count_list = 'dvitem_id_list error';
            }

            if (typeof bodyid_from_ls === 'undefined') {
                bodyid_from_ls = "nobodyid";
            }

            // AWS 配置
            if (typeof AWS !== 'undefined') {
                AWS.config.region = 'ap-northeast-1';
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: 'ap-northeast-1:ec9d0f5d-ae3e-4ff2-986f-2025ddbedf1a',
                });
                AWS.config.credentials.get(function (err) {});
            }

            // 生成用戶 ID 和會員 ID
            var member_id = "";
            var given_id = "";
            var lgiven_id = "";

            try {
                var chklog1 = '"currentUser\\"';
                var chklog2 = ':null';
                if (!document.documentElement.innerHTML.includes(chklog1 + chklog2)) {
                    member_id = document.documentElement.innerHTML.split('href="/users/')[1].split('",')[0].split('/edit"')[0];
                }
            } catch (e) {
                member_id = "";
            }

            // 生成 GVID
            var gvid_exist = false;
            try {
                if (typeof localStorage["GVID"] !== 'undefined') {
                    gvid_exist = true;
                } else {
                    gvid_exist = false;
                }
            } catch (e) {
                gvid_exist = false;
            }
            if (gvid_exist) {
                given_id = localStorage["GVID"];
            } else {
                given_id = makeid(20);
                localStorage.setItem("GVID", given_id);
            }

            // 生成 LGVID
            var lgvid_exist = false;
            try {
                if (typeof localStorage["LGVID"] !== 'undefined') {
                    lgvid_exist = true;
                } else {
                    lgvid_exist = false;
                }
            } catch (e) {
                lgvid_exist = false;
            }
            if (lgvid_exist) {
                lgiven_id = localStorage["LGVID"];
            } else {
                lgiven_id = makeid(20);
                localStorage.setItem("LGVID", lgiven_id);
            }

            // 構建查詢數據
            var product_id_query = item_id_list;
            var name_query = itemname_id_list;
            var size_query = dvitem_id_list;
            var count_query = count_list;
            var price_query = priceitem_list;

            var Payload_string = '{"PRODUCT_ID": "' + item_id_list.toString() +
                '","SKU_ID": "' + sku_id_list.toString() +
                '","NAME": "' + itemname_id_list.toString() +
                '","TSCode": "' + TSCode.toString() +
                '","TGCode": "' + TGCode.toString() +
                '","Size": "' + dvitem_id_list.toString() +
                '","PRICE": "' + priceitem_list.toString() +
                '","COUNT": "' + count_query.toString() +
                '","PRODUCT_ID_QUERY": "' + product_id_query.toString() +
                '","NAME_QUERY": "' + name_query.toString() +
                '","Size_QUERY": "' + size_query.toString() +
                '","PRICE_QUERY": "' + price_query.toString() +
                '","COUNT_QUERY": "' + count_query.toString() +
                '","GVID":"' + given_id +
                '","LGVID":"' + lgiven_id +
                '","MRID":"' + member_id +
                '","CLOTHLIST": "' + bodyid_from_ls.toString() +
                '","Brand": "' + Brand +
                '","ORDERID_INNER": "' + order_id_inner +
                '","ORDERID": "' + order_id +
                '","MKT": "' + true +
                '"}';

            // 調用 AWS Lambda 函數
            if (typeof AWS !== 'undefined') {
                var lambda = new AWS.Lambda({ region: 'ap-northeast-1', apiVersion: '2015-03-31' });
                var pullParams = {
                    FunctionName: 'FindINFByID_Brand',
                    InvocationType: 'RequestResponse',
                    LogType: 'Tail',
                    Payload: Payload_string
                };

                lambda.invoke(pullParams, function (error, data) {
                    if (error) {
                        // console.warn('AWS Lambda 調用失敗:', error);
                    } else {
                        var pullResults = JSON.parse(data.Payload);
                        // console.log('AWS Lambda 調用成功');
                    }
                    try {
                        localStorage.removeItem('GVID');
                    } catch (e) {}
                });
            }
        }
    }, false);

    // 載入 AWS SDK
    var awslib = document.createElement("script");
    awslib.type = "text/javascript";
    awslib.src = "https://sdk.amazonaws.com/js/aws-sdk-2.243.1.min.js";
    document.head.appendChild(awslib);
    awslib.addEventListener('load', function () {
        var LINK_SRC = "https://inffits.com/";
        var div = document.createElement('div');
        div.innerHTML = '<div id="LS_include_div" style="position:absolute; top:0px; text-align:left; display:none; border:none; outline:none; z-index:19; touch-action:none"><iframe id="inffits_LS_window" style="width:100%; height:100%; display:none; position:relative; border:none; outline:none; z-index:19" src="https://inffits.com/webDesign/HTML/DB/LS/LS_include_Size.html"></iframe></div>';
        document.body.appendChild(div);
    });
}

// 將 FindINF_proc 函數暴露到全局作用域
window.FindINF_proc = FindINF_proc;
