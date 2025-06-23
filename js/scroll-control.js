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

            // 初始檢查
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
                        canScroll: selection.scrollHeight > selection.clientHeight
                    });

                    // 檢查是否需要滾動控制（內容高度是否超過 3 行）
                    const shouldApplyScrollControl = selection.scrollHeight > minScrollHeight;

                    // 對齊滾動位置的函數
                    function alignScrollPosition(element, isGentle = true) {
                        if (!shouldApplyScrollControl) {
                            console.log('內容未超過 3 行，跳過對齊');
                            return;
                        }

                        const currentScroll = element.scrollTop;
                        const maxScroll = element.scrollHeight - element.clientHeight;

                        if (maxScroll <= 0) {
                            console.log('內容高度不足，無需滾動');
                            return;
                        }

                        let alignedScroll = Math.round(currentScroll / scrollStep) * scrollStep;
                        alignedScroll = Math.max(0, Math.min(maxScroll, alignedScroll));

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
                        if (!shouldApplyScrollControl) {
                            console.log('內容未超過 3 行，允許自由滾動');
                            return; // 如果內容不超過 3 行，不阻止默認滾動
                        }

                        event.preventDefault(); // 阻止默認滾動行為
                        console.log('滾輪事件觸發在元素:', selection.className);

                        const delta = event.deltaY;
                        const scrollDirection = delta > 0 ? 1 : -1;
                        const currentScroll = selection.scrollTop;
                        const maxScroll = selection.scrollHeight - selection.clientHeight;

                        if (maxScroll <= 0) {
                            console.log('內容高度不足，無需滾動');
                            return;
                        }

                        // 修正1：第一行顯示時阻止向上滾動
                        if (scrollDirection < 0 && currentScroll <= 0) {
                            console.log('已在第一行，阻止向上滾動');
                            return;
                        }

                        // 修正2：最後一行顯示時阻止向下滾動
                        const remainingScrollDown = maxScroll - currentScroll;
                        if (scrollDirection > 0 && remainingScrollDown <= 0) {
                            console.log('已在最後一行，阻止向下滾動');
                            return;
                        }

                        const scrollAmount = scrollStep * scrollDirection;
                        let targetScroll = Math.round((currentScroll + scrollAmount) / scrollStep) * scrollStep;
                        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

                        if (Math.abs(currentScroll - targetScroll) < 1) {
                            console.log('滾動距離太小，跳過滾動');
                            return;
                        }

                        console.log(`滾輪滾動: 當前=${currentScroll}, 目標=${targetScroll}, 最大=${maxScroll}`);

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

                    selection.addEventListener('touchstart', (event) => {
                        touchStartY = event.touches[0].clientY;
                        touchStartTime = Date.now();
                        touchStartScroll = selection.scrollTop;
                        isScrolling = false;
                        scrollVelocity = 0;
                        lastScrollTop = selection.scrollTop;
                        lastScrollTime = Date.now();

                        if (scrollTimeout) {
                            clearTimeout(scrollTimeout);
                        }
                    }, { passive: true });

                    selection.addEventListener('touchmove', (event) => {
                        if (!shouldApplyScrollControl) {
                            return; // 如果內容不超過 3 行，允許自由滾動
                        }

                        isScrolling = true;

                        const currentTime = Date.now();
                        const currentScroll = selection.scrollTop;
                        const timeDiff = currentTime - lastScrollTime;
                        const scrollDiff = currentScroll - lastScrollTop;

                        if (timeDiff > 0) {
                            scrollVelocity = Math.abs(scrollDiff / timeDiff);
                        }

                        lastScrollTop = currentScroll;
                        lastScrollTime = currentTime;
                    }, { passive: true });

                    selection.addEventListener('touchend', (event) => {
                        if (!shouldApplyScrollControl) {
                            console.log('內容未超過 3 行，跳過觸控對齊');
                            return;
                        }

                        if (isScrolling) {
                            const baseDelay = 50;
                            const velocityDelay = Math.min(400, scrollVelocity * 300);
                            const totalDelay = baseDelay + velocityDelay;

                            console.log(`觸摸結束: 速度=${scrollVelocity.toFixed(3)}, 延遲=${totalDelay}ms`);

                            scrollTimeout = setTimeout(() => {
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
                        if (!shouldApplyScrollControl) {
                            return; // 如果內容不超過 3 行，跳過對齊
                        }

                        if (scrollEndTimeout) {
                            clearTimeout(scrollEndTimeout);
                        }

                        const currentScroll = selection.scrollTop;

                        if (Math.abs(currentScroll - lastScrollPosition) < 1) {
                            scrollCheckCount++;
                        } else {
                            scrollCheckCount = 0;
                        }

                        lastScrollPosition = currentScroll;

                        const checkDelay = scrollCheckCount >= 3 ? 50 : 200;

                        scrollEndTimeout = setTimeout(() => {
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