document.addEventListener('DOMContentLoaded', () => {
    const rowHeight = 40; // 每行標籤高度
    const gap = 8; // 標籤間距
    const scrollStep = rowHeight + gap; // 每次滾動距離（48px）
    const maxRowsBeforeScroll = 3; // 超過 3 行才啟用逐行滾動
    const minScrollHeight = maxRowsBeforeScroll * scrollStep; // 最小滾動高度（144px）

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

            const isVisible = window.getComputedStyle(pbackElement).display !== 'none';
            const hasVisibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])').length > 0;

            if (isVisible || hasVisibleContainers) {
                lockBodyScroll();
            }
        }
    }

    // 阻止背景區域的滾動事件
    function preventBackgroundScroll() {
    document.addEventListener('wheel', (event) => {
        if (isModalOpen) {
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
        const visibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
        console.log('找到的可見容器:', visibleContainers);

        if (visibleContainers.length > 0) {
            lockBodyScroll();
        } else {
            unlockBodyScroll();
        }

        visibleContainers.forEach(container => {
            console.log('檢查容器:', container.id);

            const selectionSelectors = [
                '.swiper-wrapper .swiper-slide .axd_selections.selection',
                '.swiper-wrapper .selection',
                '.selection_scroll .swiper-slide .selection',
                '.selection',
                '.axd_selections.selection'
            ];

            let selections = [];

            for (const selector of selectionSelectors) {
                const elements = container.querySelectorAll(selector);
                if (elements.length > 0) {
                    selections = Array.from(elements);
                    console.log(`在 ${container.id} 中使用選擇器 "${selector}" 找到 ${selections.length} 個selection元素:`, selections);
                    break;
                }
            }

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

            selections.forEach((selection, index) => {
                if (!selection.hasAttribute('data-scroll-initialized')) {
                    console.log(`為 ${container.id} 中第${index + 1}個selection元素添加滾動監聽器:`, selection);
                    console.log('元素類名:', selection.className);
                    console.log('元素滾動信息:', {
                        scrollHeight: selection.scrollHeight,
                        clientHeight: selection.clientHeight,
                        canScroll: selection.scrollHeight > selection.clientHeight,
                        needsScrollControl: selection.scrollHeight > minScrollHeight
                    });

                    const shouldApplyScrollControl = selection.scrollHeight > minScrollHeight;

                    selection.addEventListener('wheel', (event) => {
                        if (!shouldApplyScrollControl) {
                            console.log('內容未超過 3 行，允許自由滾動');
                            return;
                        }

                        event.preventDefault();
                        console.log('滾輪事件觸發在元素:', selection.className);

                        const delta = event.deltaY;
                        const scrollDirection = delta > 0 ? 1 : -1;
                        const currentScroll = selection.scrollTop;
                        const maxScroll = selection.scrollHeight - selection.clientHeight;

                        if (maxScroll <= 0) {
                            console.log('內容高度不足，無需滾動');
                            return;
                        }

                        if (scrollDirection < 0 && currentScroll <= 0) {
                            console.log('已在第一行，阻止向上滾動');
                            return;
                        }

                        // 計算目標滾動位置
                        let targetScroll = currentScroll + (scrollStep * scrollDirection);
                        
                        // 向下滾動時，檢查是否會導致標籤只顯示一半
                        if (scrollDirection > 0) {
                            const remainingHeight = maxScroll - targetScroll;
                            
                            // 如果滾動後剩餘高度不足一個完整行高，調整到能完整顯示的位置
                            if (remainingHeight > 0 && remainingHeight < scrollStep * 0.8) {
                                // 計算能完整顯示標籤的最大滾動位置
                                const maxCompleteScroll = Math.floor(maxScroll / scrollStep) * scrollStep;
                                targetScroll = Math.min(targetScroll, maxCompleteScroll);
                                console.log(`調整目標位置避免標籤被切: 原目標=${currentScroll + scrollStep}, 調整後=${targetScroll}, 剩餘=${maxScroll - targetScroll}`);
                            }
                        }
                        
                        // 確保不超出範圍
                        const clampedScroll = Math.max(0, Math.min(maxScroll, targetScroll));
                        
                        // 檢查是否真的需要滾動
                        if (Math.abs(currentScroll - clampedScroll) < 1) {
                            console.log('滾動距離太小或已在邊界，跳過滾動');
                            return;
                        }

                        console.log(`滾輪滾動: 當前=${currentScroll}, 目標=${clampedScroll}, 最大=${maxScroll}`);

                        selection.scrollTo({
                            top: clampedScroll,
                            behavior: 'smooth'
                        });
                    });

                    // 觸控滾動依賴 CSS scroll-snap，無需額外對齊
                    let scrollTimeout = null;
                    
                    selection.addEventListener('touchstart', () => {
                        if (scrollTimeout) {
                            clearTimeout(scrollTimeout);
                        }
                    }, { passive: true });

                    selection.addEventListener('touchend', () => {
                        if (!shouldApplyScrollControl) {
                            console.log('內容未超過 3 行，跳過觸控對齊');
                            return;
                        }

                        // 延遲對齊，等待慣性滾動結束
                        scrollTimeout = setTimeout(() => {
                            const currentScroll = selection.scrollTop;
                            const maxScroll = selection.scrollHeight - selection.clientHeight;
                            
                            if (maxScroll <= 0) return;
                            
                            // 計算最接近的行對齊位置
                            let alignedScroll = Math.round(currentScroll / scrollStep) * scrollStep;
                            
                            // 檢查是否會導致標籤只顯示一半
                            const remainingHeight = maxScroll - alignedScroll;
                            if (remainingHeight > 0 && remainingHeight < scrollStep * 0.8) {
                                // 調整到能完整顯示標籤的位置
                                alignedScroll = Math.floor(maxScroll / scrollStep) * scrollStep;
                                console.log(`觸摸對齊: 調整避免標籤被切, 對齊到=${alignedScroll}, 剩餘=${maxScroll - alignedScroll}`);
                            }
                            
                            // 確保不超出範圍
                            alignedScroll = Math.max(0, Math.min(maxScroll, alignedScroll));
                            
                            // 只有偏差較大時才對齊
                            const distance = Math.abs(currentScroll - alignedScroll);
                            if (distance > 5) {
                                console.log(`觸摸對齊: 當前=${currentScroll}, 對齊=${alignedScroll}, 距離=${distance}`);
                                selection.scrollTo({
                                    top: alignedScroll,
                                    behavior: 'smooth'
                                });
                            }
                        }, 150);
                    }, { passive: true });

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

    // 監聽DOM變化
    const observer = new MutationObserver((mutations) => {
        let shouldReinit = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' ||
                (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
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

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    console.log('滾動控制初始化完成，正在監聽容器變化...');
});