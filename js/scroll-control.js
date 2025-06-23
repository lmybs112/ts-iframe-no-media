document.addEventListener('DOMContentLoaded', () => {
    const rowHeight = 40; // 每行標籤高度
    const gap = 8; // 標籤間距
    const scrollStep = rowHeight + gap; // 每次滾動距離（48px）

    // 背景滾動鎖定功能
    let isModalOpen = false;
    let bodyScrollPosition = 0;

    function lockBodyScroll() {
        if (!isModalOpen) {
            bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${bodyScrollPosition}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            isModalOpen = true;
            console.log('背景滾動已鎖定');
        }
    }

    function unlockBodyScroll() {
        if (isModalOpen) {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, bodyScrollPosition);
            isModalOpen = false;
            console.log('背景滾動已解鎖');
        }
    }

    // 監聽彈窗的顯示/隱藏
    function observeModalChanges() {
        const pbackElement = document.getElementById('pback');
        if (pbackElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isVisible = window.getComputedStyle(pbackElement).display !== 'none';
                        const hasVisibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])').length > 0;

                        if (isVisible || hasVisibleContainers) {
                            lockBodyScroll();
                        } else {
                            unlockBodyScroll();
                        }
                    }
                });
            });

            observer.observe(pbackElement, {
                attributes: true,
                attributeFilter: ['style']
            });

            // 初始檢查
            const isVisible = window.getComputedStyle(pbackElement).display !== 'none';
            const hasVisibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])').length > 0;

            if (isVisible || hasVisibleContainers) {
                lockBodyScroll();
            }
        }
    // 阻止背景區域的滾動事件
    function preventBackgroundScroll() {
        document.addEventListener('wheel', (event) => {
            if (isModalOpen) {
                // 檢查事件目標是否在彈窗內的可滾動元素中
                const target = event.target;
                const isInScrollableArea = target.closest('.axd_selections.selection') || 
                                         target.closest('.swiper-slide') ||
                                         target.closest('.tag-desc-container');
                
                if (!isInScrollableArea) {
                    event.preventDefault();
                    console.log('阻止背景滾動');
                }
            }
        }, { passive: false });
        
        // 阻止觸摸滾動（手機版）
        document.addEventListener('touchmove', (event) => {
            if (isModalOpen) {
                const target = event.target;
                const isInScrollableArea = target.closest('.axd_selections.selection') || 
                                         target.closest('.swiper-slide') ||
                                         target.closest('.tag-desc-container');
                
                if (!isInScrollableArea) {
                    event.preventDefault();
                    console.log('阻止背景觸摸滾動');
                }
            }
        }, { passive: false });
    }
    
    // 初始化滾動控制
    function initScrollControl() {
        // 查找當前顯示的容器
        const visibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
        console.log('找到的可見容器:', visibleContainers);
        
        // 如果有可見容器，鎖定背景滾動
        if (visibleContainers.length > 0) {
            lockBodyScroll();
        } else {
            unlockBodyScroll();
        }
        
        visibleContainers.forEach(container => {
            console.log('檢查容器:', container.id);
            
            // 多種選擇器策略，適應不同的結構
            const selectionSelectors = [
                '.swiper-wrapper .swiper-slide .axd_selections.selection',  // 手機版 swiper 結構
                '.swiper-wrapper .selection',  // 原始結構
                '.selection_scroll .swiper-slide .selection',  // 另一種可能結構
                '.selection',  // 直接查找 selection
                '.axd_selections.selection'  // 具體的 selection 類
            ];
            
            let selections = [];
            
            // 嘗試每種選擇器
            for (const selector of selectionSelectors) {
                const elements = container.querySelectorAll(selector);
                if (elements.length > 0) {
                    selections = Array.from(elements);
                    console.log(`在 ${container.id} 中使用選擇器 "${selector}" 找到 ${selections.length} 個selection元素:`, selections);
                    break;
                }
            }
            
            // 如果還是沒找到，嘗試查找所有可滾動元素
            if (selections.length === 0) {
                const scrollableElements = Array.from(container.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return el.scrollHeight > el.clientHeight && 
                           (style.overflow === 'auto' || style.overflow === 'scroll' || 
                            style.overflowY === 'auto' || style.overflowY === 'scroll');
                });
                
                if (scrollableElements.length > 0) {
                    selections = scrollableElements;
                    console.log(`在 ${container.id} 中找到 ${selections.length} 個可滾動元素:`, selections);
                }
            }
            
            // 對每個selection元素添加滾動監聽器
            selections.forEach((selection, index) => {
                // 檢查是否已經添加過監聽器（避免重複添加）
                if (!selection.hasAttribute('data-scroll-initialized')) {
                    console.log(`為 ${container.id} 中第${index + 1}個selection元素添加滾動監聽器:`, selection);
                    console.log('元素類名:', selection.className);
                    console.log('元素滾動信息:', {
                        scrollHeight: selection.scrollHeight,
                        clientHeight: selection.clientHeight,
                        canScroll: selection.scrollHeight > selection.clientHeight
                    });
                    
                    // 對齊滾動位置的函數
                    function alignScrollPosition(element, isGentle = true) {
                        const currentScroll = element.scrollTop;
                        const maxScroll = element.scrollHeight - element.clientHeight;
                        
                        // 如果內容不需要滾動，直接返回
                        if (maxScroll <= 0) {
                            console.log('內容高度不足，無需滾動');
                            return;
                        }
                        
                        // 計算理想的對齊位置
                        let alignedScroll = Math.round(currentScroll / scrollStep) * scrollStep;
                        
                        // 確保不超出範圍
                        alignedScroll = Math.max(0, Math.min(maxScroll, alignedScroll));
                        
                        // 調整吸附閾值，只有偏差較大時才吸附
                        const threshold = isGentle ? scrollStep * 0.3 : 1;
                        const distance = Math.abs(currentScroll - alignedScroll);
                        
                        if (distance > threshold) {
                            console.log(`對齊滾動: 當前=${currentScroll}, 對齊=${alignedScroll}, 距離=${distance}, 最大=${maxScroll}`);
                            
                            element.scrollTo({
                                top: alignedScroll,
                                behavior: 'smooth'
                            });
                        }
                    }
                    
                    // 滾輪事件（電腦版）
                    selection.addEventListener('wheel', (event) => {
                        event.preventDefault(); // 阻止默認滾動行為
                        console.log('滾輪事件觸發在元素:', selection.className);

                        const delta = event.deltaY; // 獲取滾動方向
                        const scrollDirection = delta > 0 ? 1 : -1; // 正數向下，負數向上
                        const currentScroll = selection.scrollTop;
                        const maxScroll = selection.scrollHeight - selection.clientHeight;
                        
                        // 如果內容不需要滾動，直接返回
                        if (maxScroll <= 0) {
                            console.log('內容高度不足，無需滾動');
                            return;
                        }
                        
                        // 修正1：頂部邊界檢查 - 已在第一行，不允許向上滾動
                        if (scrollDirection < 0 && currentScroll <= 0) {
                            console.log('已在第一行，阻止向上滾動');
                            return;
                        }
                        
                        // 修正2：底部邊界檢查 - 最後一行顯示時，不允許向下滾動
                        const remainingScrollDown = maxScroll - currentScroll;
                        if (scrollDirection > 0 && remainingScrollDown <= 0) {
                            console.log('已在最後一行，阻止向下滾動');
                            return;
                        }
                        
                        // 計算目標滾動位置
                        const scrollAmount = scrollStep * scrollDirection;
                        let targetScroll = Math.round((currentScroll + scrollAmount) / scrollStep) * scrollStep;
                        
                        // 確保不超出範圍
                        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
                        
                        // 檢查是否真的需要滾動
                        if (Math.abs(currentScroll - targetScroll) < 1) {
                            console.log('滾動距離太小，跳過滾動');
                            return;
                        }
                        
                        console.log(`滾輪滾動: 當前=${currentScroll}, 目標=${targetScroll}, 最大=${maxScroll}`);

                        // 執行平滑滾動
                        selection.scrollTo({
                            top: targetScroll,
                            behavior: 'smooth'
                        });
                    });
                    
                    // 手機觸摸滾動支持
                    let touchStartY = 0;
                    let touchStartTime = 0;
                    let touchStartScroll = 0;
                    let isScrolling = false;
                    let scrollTimeout = null;
                    let lastScrollTop = 0;
                    let scrollVelocity = 0;
                    let lastScrollTime = Date.now();
                    
                    // 觸摸開始
                    selection.addEventListener('touchstart', (event) => {
                        touchStartY = event.touches[0].clientY;
                        touchStartTime = Date.now();
                        touchStartScroll = selection.scrollTop;
                        isScrolling = false;
                        scrollVelocity = 0;
                        lastScrollTop = selection.scrollTop;
                        lastScrollTime = Date.now();
                        
                        // 清除之前的對齊計時器
                        if (scrollTimeout) {
                            clearTimeout(scrollTimeout);
                        }
                    }, { passive: true });
                    
                    // 觸摸移動
                    selection.addEventListener('touchmove', (event) => {
                        isScrolling = true;
                        
                        // 計算滾動速度
                        const currentTime = Date.now();
                        const currentScroll = selection.scrollTop;
                        const timeDiff = currentTime - lastScrollTime;
                        const scrollDiff = currentScroll - lastScrollTop;
                        
                        if (timeDiff > 0) {
                            scrollVelocity = Math.abs(scrollDiff / timeDiff); // px/ms
                        }
                        
                        lastScrollTop = currentScroll;
                        lastScrollTime = currentTime;
                    }, { passive: true });
                    
                    // 觸摸結束
                    selection.addEventListener('touchend', (event) => {
                        if (isScrolling) {
                            // 根據滾動速度調整延遲時間
                            const baseDelay = 50;
                            const velocityDelay = Math.min(400, scrollVelocity * 300);
                            const totalDelay = baseDelay + velocityDelay;
                            
                            console.log(`觸摸結束: 速度=${scrollVelocity.toFixed(3)}, 延遲=${totalDelay}ms`);
                            
                            // 延遲對齊，等待慣性滾動結束
                            scrollTimeout = setTimeout(() => {
                                // 高速滾動時使用溫和吸附，低速滾動時使用精確吸附
                                const isGentle = scrollVelocity > 0.5;
                                alignScrollPosition(selection, isGentle);
                            }, totalDelay);
                        }
                    }, { passive: true });
                    
                    // 監聽滾動事件，處理慣性滾動結束後的對齊
                    let scrollEndTimeout = null;
                    let scrollCheckCount = 0;
                    let lastScrollPosition = 0;
                    
                    selection.addEventListener('scroll', () => {
                        // 清除之前的計時器
                        if (scrollEndTimeout) {
                            clearTimeout(scrollEndTimeout);
                        }
                        
                        const currentScroll = selection.scrollTop;
                        
                        // 檢查滾動是否真的停止了
                        if (Math.abs(currentScroll - lastScrollPosition) < 1) {
                            scrollCheckCount++;
                        } else {
                            scrollCheckCount = 0;
                        }
                        
                        lastScrollPosition = currentScroll;
                        
                        // 設置新的計時器，在滾動停止後對齊
                        const checkDelay = scrollCheckCount >= 3 ? 50 : 200;
                        
                        scrollEndTimeout = setTimeout(() => {
                            // 最終檢查：如果滾動位置沒有變化，進行溫和對齊
                            if (Math.abs(selection.scrollTop - lastScrollPosition) < 2) {
                                alignScrollPosition(selection, true);
                            }
                        }, checkDelay);
                    }, { passive: true });
                    
                    // 標記已初始化
                    selection.setAttribute('data-scroll-initialized', 'true');
                }
            });
            
            if (selections.length === 0) {
                console.warn(`在容器 ${container.id} 中沒有找到任何可滾動的selection元素`);
            }
        });
    }
    
    // 初始化
    initScrollControl();
    observeModalChanges();
    preventBackgroundScroll();
    
    // 監聽DOM變化，當新容器出現時重新初始化
    const observer = new MutationObserver((mutations) => {
        let shouldReinit = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || 
                (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
                // 檢查是否有新的容器顯示
                const newContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
                if (newContainers.length > 0) {
                    shouldReinit = true;
                }
            }
        });
        
        if (shouldReinit) {
            console.log('檢測到容器變化，重新初始化滾動控制');
            initScrollControl();
        }
    });
    
    // 開始觀察整個文檔的變化
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    console.log('滾動控制初始化完成，正在監聽容器變化...');
}})