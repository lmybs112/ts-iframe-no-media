document.addEventListener('DOMContentLoaded', () => {
    console.log('增強滾動控制啟動...');

    // 創建和管理滾動提示箭頭
    let scrollDownArrow = null;
    
    function createScrollDownArrow() {
        if (scrollDownArrow) return scrollDownArrow;
        
        // 創建三箭頭容器
        const arrowContainer = document.createElement('div');
        arrowContainer.className = 'scroll-down-hint';
        arrowContainer.innerHTML = `
            <div class="scroll-triple-arrows">
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                    <path d="M7 2L12 7L17 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                    <path d="M7 2L12 7L17 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                    <path d="M7 2L12 7L17 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        
        // 添加質感樣式
        const style = document.createElement('style');
        style.textContent = `
            .scroll-down-hint {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                animation: scrollHintFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .scroll-triple-arrows {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: -2px;
                animation: scrollHintFloat 2s ease-in-out infinite;
            }
            
            .scroll-triple-arrows svg {
                color: rgba(0, 0, 0, 0.6);
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
                transition: all 0.3s ease;
            }
            
            .scroll-triple-arrows svg:nth-child(1) {
                animation: scrollArrow1 2s ease-in-out infinite;
            }
            
            .scroll-triple-arrows svg:nth-child(2) {
                animation: scrollArrow2 2s ease-in-out infinite;
                animation-delay: 0.2s;
            }
            
            .scroll-triple-arrows svg:nth-child(3) {
                animation: scrollArrow3 2s ease-in-out infinite;
                animation-delay: 0.4s;
            }
            
            @keyframes scrollHintFadeIn {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes scrollHintFadeOut {
                0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px) scale(0.9);
                }
            }
            
            @keyframes scrollHintFloat {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-3px);
                }
            }
            
            @keyframes scrollArrow1 {
                0%, 60%, 100% {
                    opacity: 0.3;
                    transform: translateY(0);
                }
                20% {
                    opacity: 1;
                    transform: translateY(-2px);
                }
            }
            
            @keyframes scrollArrow2 {
                0%, 60%, 100% {
                    opacity: 0.3;
                    transform: translateY(0);
                }
                20% {
                    opacity: 1;
                    transform: translateY(-2px);
                }
            }
            
            @keyframes scrollArrow3 {
                0%, 60%, 100% {
                    opacity: 0.3;
                    transform: translateY(0);
                }
                20% {
                    opacity: 1;
                    transform: translateY(-2px);
                }
            }
            
            /* 響應式設計 */
            @media (max-width: 400px) {
                .scroll-down-hint {
                    bottom: 8px;
                }
                
                .scroll-triple-arrows svg {
                    width: 20px;
                    height: 10px;
                }
            }
            
            /* 暗色主題適配 */
            @media (prefers-color-scheme: dark) {
                .scroll-triple-arrows svg {
                    color: rgba(255, 255, 255, 0.7);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                }
            }
        `;
        
        document.head.appendChild(style);
        scrollDownArrow = arrowContainer;
        return arrowContainer;
    }
    
    function showScrollDownArrow() {
        console.log('🎯 顯示向下滾動箭頭提示');
        
        const arrow = createScrollDownArrow();
        
        // 動態尋找當前顯示的容器
        // 嘗試多種方式找到當前活躍的容器
        let currentContainer = null;
        
        // 方法1: 尋找所有可能的容器ID模式，找到當前顯示的那個
        const containerSelectors = [
            '[id^="container-"]:not([style*="display: none"]):not([style*="display:none"])',
            '.container.mbinfo.animX.animFadeIn.update_delete:not([style*="display: none"])',
            '.container.mbinfo.animX.animFadeIn.update_delete[style*="display: block"]',
            '.container.mbinfo.animX.animFadeIn.update_delete'
        ];
        
        for (const selector of containerSelectors) {
            const containers = document.querySelectorAll(selector);
            
            // 找到當前顯示的容器（沒有 display: none）
            for (const container of containers) {
                const computedStyle = window.getComputedStyle(container);
                const isVisible = computedStyle.display !== 'none' && 
                                 computedStyle.visibility !== 'hidden' &&
                                 container.offsetParent !== null;
                
                if (isVisible) {
                    console.log(`✅ 找到當前顯示的容器: ${container.id || container.className}`);
                    currentContainer = container;
                    break;
                }
            }
            
            if (currentContainer) break;
        }
        
        // 方法2: 如果上面沒找到，嘗試通過全域變數或其他方式獲取當前路由
        if (!currentContainer) {
            // 檢查是否有全域的 fs 和 all_Route 變數（從 iframe.js）
            if (typeof window.fs !== 'undefined' && typeof window.all_Route !== 'undefined') {
                const currentRoute = window.all_Route[window.fs]?.replaceAll(" ", "");
                if (currentRoute) {
                    currentContainer = document.querySelector(`#container-${currentRoute}`);
                    console.log(`📍 通過全域變數找到容器: #container-${currentRoute}`);
                }
            }
        }
        
        // 方法3: 如果還是沒找到，使用原來的備用方案
        if (!currentContainer) {
            currentContainer = document.querySelector('.container.mbinfo.animX.animFadeIn.update_delete');
            console.log('⚠️ 使用備用容器選擇器');
        }
        
        if (currentContainer) {
            // 將箭頭添加到當前容器
            if (!currentContainer.contains(arrow)) {
                currentContainer.appendChild(arrow);
                console.log(`✨ 箭頭提示已添加到容器: ${currentContainer.id || currentContainer.className}`);
                
                // 設置隱藏邏輯
                setupArrowHideLogic(arrow, currentContainer);
            } else {
                console.log('箭頭已存在於當前容器中');
            }
        } else {
            console.warn('⚠️ 未找到任何適合的容器元素');
        }
    }

    // 設置箭頭隱藏邏輯
    function setupArrowHideLogic(arrowElement, containerElement) {
        let isHiding = false;
        let hasHidden = false;
        
        // 隱藏箭頭的函數
        function hideArrow(reason = '未知') {
            if (isHiding || hasHidden) return;
            isHiding = true;
            hasHidden = true;
            
            console.log(`🫥 隱藏箭頭提示 - 原因: ${reason}`);
            
            // 添加淡出動畫
            arrowElement.style.animation = 'scrollHintFadeOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            // 動畫完成後移除元素
            setTimeout(() => {
                if (arrowElement && arrowElement.parentNode) {
                    arrowElement.parentNode.removeChild(arrowElement);
                    console.log('🗑️ 箭頭提示已從DOM移除');
                }
                // 重置全局變數以便下次顯示
                scrollDownArrow = null;
            }, 400);
        }
        
        // 檢測真實有效的滾動行為
        const selectionElements = containerElement.querySelectorAll('.axd_selections.selection, .selection, [class*="selection"]');
        
        selectionElements.forEach(element => {
            let initialScrollTop = element.scrollTop;
            
            const checkMeaningfulScroll = () => {
                const currentScroll = element.scrollTop;
                const scrollDistance = Math.abs(currentScroll - initialScrollTop);
                const maxScroll = element.scrollHeight - element.clientHeight;
                
                // 只有滾動距離超過一行的高度才算有意義的滾動
                const rowHeight = calculateRowHeight(element) || 40;
                const meaningfulDistance = rowHeight * 0.8; // 80%的一行高度
                
                if (scrollDistance > meaningfulDistance) {
                    console.log(`✅ 有意義的滾動: ${scrollDistance}px (超過${meaningfulDistance}px)`);
                    hideArrow('用戶確實滾動了內容');
                    return;
                }
                
                // 滾動到底部也隱藏
                if (currentScroll >= maxScroll - 5) {
                    hideArrow('滾動到底部');
                    return;
                }
                
                console.log(`📏 滾動檢測: 移動${scrollDistance}px (需要>${meaningfulDistance}px才隱藏)`);
            };
            
            element.addEventListener('scroll', checkMeaningfulScroll, { passive: true });
        });
        
        // 頁面失去焦點時隱藏
        const hideOnBlur = () => {
            if (!hasHidden) {
                hideArrow('頁面失去焦點');
            }
        };
        window.addEventListener('blur', hideOnBlur, { once: true, passive: true });
        
        // 頁面隱藏時隱藏
        const hideOnVisibilityChange = () => {
            if (document.hidden && !hasHidden) {
                hideArrow('頁面隱藏');
            }
        };
        document.addEventListener('visibilitychange', hideOnVisibilityChange, { once: true, passive: true });
        
        console.log('🎭 箭頭隱藏邏輯設置完成 (移除10秒自動隱藏，需要有意義的滾動才隱藏)');
    }

    // 動態計算每行標籤的實際高度
    function calculateRowHeight(selectionElement) {
        const tags = selectionElement.querySelectorAll('.axd_selection');
        if (tags.length === 0) return 48; // 默認值

        const firstTag = tags[0];
        const style = window.getComputedStyle(firstTag);
        const height = firstTag.offsetHeight || parseInt(style.height) || parseInt(style.minHeight) || 40;
        const marginBottom = parseInt(style.marginBottom) || 8;
        
        console.log(`計算的行高: ${height + marginBottom}px (高度: ${height}px, 間距: ${marginBottom}px)`);
        return height + marginBottom;
    }

    // 計算實際可見行數
    function calculateVisibleRows(selectionElement) {
        const containerHeight = selectionElement.clientHeight;
        const rowHeight = calculateRowHeight(selectionElement);
        const visibleRows = Math.floor(containerHeight / rowHeight);
        console.log(`容器高度: ${containerHeight}px, 行高: ${rowHeight}px, 可見行數: ${visibleRows}`);
        return visibleRows;
    }

    // 計算總行數
    function calculateTotalRows(selectionElement) {
        const tags = selectionElement.querySelectorAll('.axd_selection');
        const totalRows = tags.length;
        console.log(`標籤總數: ${totalRows}`);
        return totalRows;
    }

    // 計算當前滾動位置對應的行數
    function getCurrentRowIndex(scrollTop, rowHeight) {
        return Math.round(scrollTop / rowHeight);
    }

    // 計算目標行的滾動位置
    function getTargetScrollPosition(targetRowIndex, rowHeight, maxScroll) {
        const targetScroll = targetRowIndex * rowHeight;
        return Math.max(0, Math.min(maxScroll, targetScroll));
    }

    // 增強的滾動控制函數
    function enhanceScrollControl(selectionElement) {
        if (selectionElement.hasAttribute('data-enhanced-scroll')) {
            console.log(`⚠️ 元素 ${selectionElement.className} 已經有增強滾動控制，跳過重複初始化`);
            return; // 已經初始化過了
        }

        // 清理可能存在的舊事件監聽器（防止重複綁定）
        if (selectionElement._scrollCleanup) {
            console.log(`🧹 清理元素 ${selectionElement.className} 的舊事件監聽器`);
            selectionElement._scrollCleanup();
        }

        const rowHeight = calculateRowHeight(selectionElement);
        const totalRows = calculateTotalRows(selectionElement);
        const visibleRows = calculateVisibleRows(selectionElement);
        
        console.log(`滾動控制設置: 總行數=${totalRows}, 可見行數=${visibleRows}, 行高=${rowHeight}px`);

        // 只要有內容需要滾動就啟用控制（移除3行限制）
        const needsScrolling = selectionElement.scrollHeight > selectionElement.clientHeight;
        
        if (!needsScrolling) {
            console.log('內容不需要滾動，跳過滾動控制');
            return;
        }

        // 用於清理事件監聽器的函數集合
        const eventCleanupFunctions = [];
        
        // 查找外部容器並設置滾動代理
        function setupScrollProxy() {
            // 動態尋找當前顯示的外部容器
            let outerContainer = null;
            
            // 優先尋找當前顯示的 container-${route} 容器
            const containerSelectors = [
                '[id^="container-"]:not([style*="display: none"]):not([style*="display:none"])',
                '.container.mbinfo.animX.animFadeIn.update_delete:not([style*="display: none"])',
                '.container.mbinfo.animX.animFadeIn.update_delete.bg-loaded',
                '.container.mbinfo.animX.animFadeIn.update_delete'
            ];
            
            for (const selector of containerSelectors) {
                const containers = document.querySelectorAll(selector);
                
                // 找到當前顯示的容器
                for (const container of containers) {
                    const computedStyle = window.getComputedStyle(container);
                    const isVisible = computedStyle.display !== 'none' && 
                                     computedStyle.visibility !== 'hidden' &&
                                     container.offsetParent !== null;
                    
                    // 確保這個容器包含當前的 selectionElement
                    if (isVisible && container.contains(selectionElement)) {
                        console.log(`🔗 找到包含當前滾動元素的外部容器: ${container.id || container.className}`);
                        outerContainer = container;
                        break;
                    }
                }
                
                if (outerContainer) break;
            }
            
            // 如果通過全域變數也找不到，使用備用方案
            if (!outerContainer) {
                outerContainer = document.querySelector('.container.mbinfo.animX.animFadeIn.update_delete.bg-loaded') ||
                               document.querySelector('.container.mbinfo.animX.animFadeIn.update_delete');
                if (outerContainer) {
                    console.log('⚠️ 使用備用外部容器選擇器');
                }
            }
            
            if (outerContainer) {
                console.log(`🔗 設置滾動代理，外部容器: ${outerContainer.id || outerContainer.className}`);
                
                // 外部容器滾輪事件代理
                const outerWheelHandler = (event) => {
                    // 檢查是否在可滾動元素內
                    const targetElement = event.target;
                    
                    // 尋找最近的可滾動父元素
                    const scrollableParent = targetElement.closest('.tag-desc-container, .typewriter, [class*="typewriter"]');
                    
                    if (scrollableParent) {
                        // 檢查該元素是否確實需要滾動
                        const needsScroll = scrollableParent.scrollHeight > scrollableParent.clientHeight;
                        
                        if (needsScroll) {
                            console.log(`📜 在可滾動元素內 (${scrollableParent.className})，允許原生滾動`);
                            // 完全不攔截，讓瀏覽器處理原生滾動
                            return;
                        }
                    }
                    
                    // 檢查事件目標是否不在標籤區域內
                    if (!selectionElement.contains(event.target)) {
                        // 檢查是否有標籤還在進行淡入動畫
                        const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
                        const hasAnimatingTags = animatingTags.length > 0;
                        
                        if (hasAnimatingTags) {
                            console.log(`🚫 標籤淡入動畫進行中，禁止外部滾動代理 (還有 ${animatingTags.length} 個標籤未完成動畫)`);
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                        }
                        
                        console.log('🔄 外部容器滾動，代理到標籤區域');
                        
                        // 阻止外部容器的默認滾動
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // 創建新的滾輪事件，觸發標籤區域滾動
                        const proxyEvent = new WheelEvent('wheel', {
                            deltaY: event.deltaY,
                            deltaX: event.deltaX,
                            deltaZ: event.deltaZ,
                            deltaMode: event.deltaMode,
                            bubbles: true,
                            cancelable: true
                        });
                        
                        // 直接觸發標籤區域的滾輪處理
                        selectionElement.dispatchEvent(proxyEvent);
                    }
                };
                
                outerContainer.addEventListener('wheel', outerWheelHandler, { passive: false, capture: true });
                eventCleanupFunctions.push(() => {
                    outerContainer.removeEventListener('wheel', outerWheelHandler, { capture: true });
                });
                
                // 外部容器觸摸事件代理
                let outerTouchStartY = 0;
                
                const outerTouchStartHandler = (event) => {
                    // 檢查是否在可滾動元素內
                    const targetElement = event.target;
                    const scrollableParent = targetElement.closest('.tag-desc-container, .typewriter, [class*="typewriter"]');
                    
                    if (scrollableParent) {
                        const needsScroll = scrollableParent.scrollHeight > scrollableParent.clientHeight;
                        if (needsScroll) {
                            console.log(`📜 在可滾動元素內 (${scrollableParent.className})，允許原生觸摸滾動`);
                            return;
                        }
                    }
                    
                    if (!selectionElement.contains(event.target)) {
                        outerTouchStartY = event.touches[0].clientY;
                        console.log('👆 外部容器觸摸開始');
                    }
                };
                
                const outerTouchMoveHandler = (event) => {
                    // 檢查是否在可滾動元素內
                    const targetElement = event.target;
                    const scrollableParent = targetElement.closest('.tag-desc-container, .typewriter, [class*="typewriter"]');
                    
                    if (scrollableParent) {
                        const needsScroll = scrollableParent.scrollHeight > scrollableParent.clientHeight;
                        if (needsScroll) {
                            // 完全不攔截，讓瀏覽器處理原生觸摸滾動
                            return;
                        }
                    }
                    
                    if (!selectionElement.contains(event.target) && outerTouchStartY) {
                        // 檢查是否有標籤還在進行淡入動畫
                        const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
                        const hasAnimatingTags = animatingTags.length > 0;
                        
                        if (hasAnimatingTags) {
                            console.log(`🚫 標籤淡入動畫進行中，禁止外部觸摸移動 (還有 ${animatingTags.length} 個標籤未完成動畫)`);
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                        }
                        
                        const touchY = event.touches[0].clientY;
                        const deltaY = outerTouchStartY - touchY;
                        
                        // 阻止外部滾動
                        event.preventDefault();
                        
                        // 模擬標籤區域滾動
                        const currentScroll = selectionElement.scrollTop;
                        const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
                        const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + deltaY * 2));
                        
                        selectionElement.scrollTop = newScroll;
                        outerTouchStartY = touchY; // 更新觸摸位置
                        
                        console.log(`📱 外部觸摸滾動代理: ${deltaY}px -> 標籤區域: ${newScroll}px`);
                        
                        // 如果滾動到頂部附近，顯示箭頭提示
                        if (newScroll <= 5 && maxScroll > 0) {
                            const currentRowIndex = getCurrentRowIndex(newScroll, rowHeight);
                            if (currentRowIndex === 0) {
                                console.log('📱 外部觸摸代理檢測：滾動到頂部，顯示箭頭提示');
                                setTimeout(() => showScrollDownArrow(), 100); // 稍微延遲
                            }
                        }
                    }
                };
                
                const outerTouchEndHandler = () => {
                    outerTouchStartY = 0;
                    console.log('👆 外部容器觸摸結束');
                };
                
                outerContainer.addEventListener('touchstart', outerTouchStartHandler, { passive: true, capture: true });
                outerContainer.addEventListener('touchmove', outerTouchMoveHandler, { passive: false, capture: true });
                outerContainer.addEventListener('touchend', outerTouchEndHandler, { passive: true, capture: true });
                
                eventCleanupFunctions.push(() => {
                    outerContainer.removeEventListener('touchstart', outerTouchStartHandler, { capture: true });
                    outerContainer.removeEventListener('touchmove', outerTouchMoveHandler, { capture: true });
                    outerContainer.removeEventListener('touchend', outerTouchEndHandler, { capture: true });
                });
                
                console.log('✅ 外部容器滾動代理設置完成');
            } else {
                console.warn('⚠️ 未找到外部容器 .container.mbinfo.animX.animFadeIn.update_delete.bg-loaded');
            }
        }
        
        // 設置滾動代理
        setupScrollProxy();
        
        // 滾輪事件處理
        const wheelHandler = (event) => {
            // 檢查是否有標籤還在進行淡入動畫
            const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
            const hasAnimatingTags = animatingTags.length > 0;
            
            if (hasAnimatingTags) {
                console.log(`🚫 標籤淡入動畫進行中，禁止滾動 (還有 ${animatingTags.length} 個標籤未完成動畫)`);
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
            
            if (maxScroll <= 0) {
                console.log('內容不需要滾動');
                return;
            }

            event.preventDefault();
            
            const currentScroll = selectionElement.scrollTop;
            const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
            const scrollDirection = event.deltaY > 0 ? 1 : -1;
            
            let targetRowIndex = currentRowIndex + scrollDirection;
            
            // 確保不超出範圍
            targetRowIndex = Math.max(0, Math.min(totalRows - visibleRows, targetRowIndex));
            
            // 計算目標滾動位置
            const targetScroll = getTargetScrollPosition(targetRowIndex, rowHeight, maxScroll);
            
            console.log(`滾輪滾動: 當前行=${currentRowIndex}, 目標行=${targetRowIndex}, 滾動至=${targetScroll}px`);
            
            // 檢測是否在頂部，顯示向下滾動箭頭提示
            if (currentRowIndex === 0 && targetRowIndex === 0 && targetScroll === 0) {
                showScrollDownArrow();
            }
            
            selectionElement.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('wheel', wheelHandler);
        });

        // 觸摸滾動增強處理
        let touchScrollTimeout = null;
        let isUserScrolling = false;
        let lastScrollTime = 0;
        let touchStartY = 0;
        let isTouchScrolling = false;
        
        // 觸摸開始
        const touchStartHandler = (event) => {
            // 檢查是否有標籤還在進行淡入動畫
            const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
            const hasAnimatingTags = animatingTags.length > 0;
            
            if (hasAnimatingTags) {
                console.log(`🚫 標籤淡入動畫進行中，禁止觸摸滾動 (還有 ${animatingTags.length} 個標籤未完成動畫)`);
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            touchStartY = event.touches[0].clientY;
            isTouchScrolling = true;
            isUserScrolling = true;
            clearTimeout(touchScrollTimeout);
            
            // 停止所有監控
            if (velocityCheckInterval) {
                clearInterval(velocityCheckInterval);
                velocityCheckInterval = null;
            }
            if (scrollMonitorInterval) {
                clearInterval(scrollMonitorInterval);
                scrollMonitorInterval = null;
            }
            
            console.log('👆 觸摸開始');
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('touchstart', touchStartHandler);
        });
        
        // 觸摸移動時的滾動處理
        const touchMoveHandler = (event) => {
            // 檢查是否有標籤還在進行淡入動畫
            const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
            const hasAnimatingTags = animatingTags.length > 0;
            
            if (hasAnimatingTags) {
                console.log(`🚫 標籤淡入動畫進行中，禁止觸摸移動滾動`);
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            if (!isTouchScrolling) return;
            
            const touchY = event.touches[0].clientY;
            const touchDelta = touchStartY - touchY;
            
            // 更新最後滾動時間
            lastScrollTime = Date.now();
            
            console.log(`👆 觸摸移動: ${touchDelta}px`);
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('touchmove', touchMoveHandler);
        });
        
        // 觸摸結束
        const touchEndHandler = () => {
            console.log('👆 觸摸結束');
            isTouchScrolling = false;
            
            // 延遲一點時間來確保滾動停止
            setTimeout(() => {
                isUserScrolling = false;
                // 啟動速度追蹤來檢測慣性滾動
                startVelocityTracking();
                
                // 檢查是否需要顯示箭頭提示（手機版特別需要）
                const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
                const currentScroll = selectionElement.scrollTop;
                const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
                
                if (maxScroll > 0 && currentRowIndex === 0 && currentScroll <= 5) { // 允許小誤差
                    console.log('📱 手機版觸摸結束檢測：回到頂部，顯示箭頭提示');
                    showScrollDownArrow();
                }
            }, 50);
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('touchend', touchEndHandler);
        });

        // 改進的滾動事件處理
        const scrollHandler = () => {
            lastScrollTime = Date.now();
            clearTimeout(touchScrollTimeout);
            
            // 使用更短的延遲來提高響應性
            touchScrollTimeout = setTimeout(() => {
                // 檢查是否真的停止滾動了
                const timeSinceLastScroll = Date.now() - lastScrollTime;
                if (timeSinceLastScroll < 50) {
                    // 還在滾動，重新設置定時器
                    clearTimeout(touchScrollTimeout);
                    setTimeout(arguments.callee, 50);
                    return;
                }
                
                const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
                if (maxScroll <= 0) return;
                
                const currentScroll = selectionElement.scrollTop;
                const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
                const targetScroll = getTargetScrollPosition(currentRowIndex, rowHeight, maxScroll);
                
                // 如果當前位置與目標位置差距較大，則進行對齊
                if (Math.abs(currentScroll - targetScroll) > 3) {
                    console.log(`✨ 執行對齊: 從${currentScroll}px 對齊到行${currentRowIndex} (${targetScroll}px)`);
                    selectionElement.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                    
                    // 等待動畫完成
                    setTimeout(() => {
                        isAligning = false;
                    }, 300);
                } else {
                    isAligning = false;
                    console.log(`✅ 位置已對齊: 行${currentRowIndex} (${currentScroll}px)`);
                }
            }, 100); // 減少延遲時間
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('scroll', scrollHandler);
        });
        
        // 添加滾動狀態監控
        let scrollMonitorInterval = null;
        
        // 防抖動處理 - 避免快速重複執行對齊
        let isAligning = false;
        
        // 慣性滾動檢測
        let lastScrollTop = selectionElement.scrollTop;
        let scrollVelocity = 0;
        let velocityCheckInterval = null;
        
        function startVelocityTracking() {
            if (velocityCheckInterval) clearInterval(velocityCheckInterval);
            
            velocityCheckInterval = setInterval(() => {
                const currentScrollTop = selectionElement.scrollTop;
                scrollVelocity = Math.abs(currentScrollTop - lastScrollTop);
                lastScrollTop = currentScrollTop;
                
                // 如果速度很低，說明滾動即將停止
                if (scrollVelocity < 2 && !isAligning) {
                    clearInterval(velocityCheckInterval);
                    velocityCheckInterval = null;
                    
                    // 延遲一點時間確保完全停止
                    setTimeout(() => {
                        if (scrollVelocity < 1) {
                            startScrollMonitoring();
                        }
                    }, 50);
                }
            }, 16); // 約60fps
        }
        
        // 改進對齊函數
        function performAlignment(scrollTop) {
            if (isAligning) return;
            
            const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
            if (maxScroll <= 0) return;
            
            isAligning = true;
            
            const currentRowIndex = getCurrentRowIndex(scrollTop, rowHeight);
            const targetScroll = getTargetScrollPosition(currentRowIndex, rowHeight, maxScroll);
            
            if (Math.abs(scrollTop - targetScroll) > 3) {
                console.log(`✨ 執行對齊: 從${scrollTop}px 對齊到行${currentRowIndex} (${targetScroll}px)`);
                selectionElement.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
                
                // 等待動畫完成
                setTimeout(() => {
                    isAligning = false;
                    
                    // 對齊完成後檢查是否需要顯示箭頭提示
                    if (currentRowIndex === 0 && targetScroll <= 5) {
                        console.log('📱 對齊完成檢測：位於頂部，顯示箭頭提示');
                        showScrollDownArrow();
                    }
                }, 300);
            } else {
                isAligning = false;
                console.log(`✅ 位置已對齊: 行${currentRowIndex} (${scrollTop}px)`);
                
                // 檢查是否需要顯示箭頭提示
                if (currentRowIndex === 0 && scrollTop <= 5) {
                    console.log('📱 位置對齊檢測：位於頂部，顯示箭頭提示');
                    showScrollDownArrow();
                }
            }
        }
        
        function startScrollMonitoring() {
            if (scrollMonitorInterval) return;
            
            let lastScrollTop = selectionElement.scrollTop;
            let stableCount = 0;
            
            scrollMonitorInterval = setInterval(() => {
                const currentScrollTop = selectionElement.scrollTop;
                
                if (Math.abs(currentScrollTop - lastScrollTop) < 1) {
                    stableCount++;
                    if (stableCount >= 3) { // 連續3次檢查都沒有變化
                        // 滾動已穩定，進行對齊
                        performAlignment(currentScrollTop);
                        
                        // 額外檢查：如果滾動停在頂部附近，顯示箭頭提示
                        const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
                        const currentRowIndex = getCurrentRowIndex(currentScrollTop, rowHeight);
                        
                        if (maxScroll > 0 && currentRowIndex === 0 && currentScrollTop <= 5) {
                            console.log('📱 滾動監控檢測：停在頂部，顯示箭頭提示');
                            showScrollDownArrow();
                        }
                        
                        clearInterval(scrollMonitorInterval);
                        scrollMonitorInterval = null;
                    }
                } else {
                    stableCount = 0;
                }
                
                lastScrollTop = currentScrollTop;
            }, 50);
        }

        // 鍵盤事件處理（可選）
        const keydownHandler = (event) => {
            // 檢查是否有標籤還在進行淡入動畫
            const animatingTags = selectionElement.querySelectorAll('.axd_selection.axd_tag:not(.tag-fade-in)');
            const hasAnimatingTags = animatingTags.length > 0;
            
            if (hasAnimatingTags) {
                console.log(`🚫 標籤淡入動畫進行中，禁止鍵盤滾動 (還有 ${animatingTags.length} 個標籤未完成動畫)`);
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            if (!selectionElement.contains(document.activeElement)) {
                return;
            }

            const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
            if (maxScroll <= 0) return;

            let scrollDirection = 0;
            
            switch (event.key) {
                case 'ArrowUp':
                    scrollDirection = -1;
                    break;
                case 'ArrowDown':
                    scrollDirection = 1;
                    break;
                case 'PageUp':
                    scrollDirection = -visibleRows;
                    break;
                case 'PageDown':
                    scrollDirection = visibleRows;
                    break;
                case 'Home':
                    selectionElement.scrollTo({ top: 0, behavior: 'smooth' });
                    event.preventDefault();
                    return;
                case 'End':
                    selectionElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
                    event.preventDefault();
                    return;
                default:
                    return;
            }

            if (scrollDirection !== 0) {
                event.preventDefault();
                
                const currentScroll = selectionElement.scrollTop;
                const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
                let targetRowIndex = currentRowIndex + scrollDirection;
                
                targetRowIndex = Math.max(0, Math.min(totalRows - visibleRows, targetRowIndex));
                const targetScroll = getTargetScrollPosition(targetRowIndex, rowHeight, maxScroll);
                
                console.log(`鍵盤滾動: 目標行=${targetRowIndex}, 滾動至=${targetScroll}px`);
                
                selectionElement.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        };
        eventCleanupFunctions.push(() => {
            selectionElement.removeEventListener('keydown', keydownHandler);
        });

        // 綁定所有事件監聽器
        selectionElement.addEventListener('wheel', wheelHandler, { passive: false });
        selectionElement.addEventListener('touchstart', touchStartHandler, { passive: true });
        selectionElement.addEventListener('touchmove', touchMoveHandler, { passive: true });
        selectionElement.addEventListener('touchend', touchEndHandler, { passive: true });
        selectionElement.addEventListener('scroll', scrollHandler, { passive: true });
        selectionElement.addEventListener('keydown', keydownHandler);

        // 標記為已初始化
        selectionElement.setAttribute('data-enhanced-scroll', 'true');
        
        // 添加可訪問性屬性
        selectionElement.setAttribute('tabindex', '0');
        selectionElement.setAttribute('role', 'listbox');
        selectionElement.setAttribute('aria-label', '標籤選擇列表');
        
        console.log(`✅ 已為元素 ${selectionElement.className} 設置增強滾動控制 (總行數: ${totalRows}, 可見行數: ${visibleRows})`);

        // 初始化完成後，檢查是否需要顯示箭頭提示
        setTimeout(() => {
            const maxScroll = selectionElement.scrollHeight - selectionElement.clientHeight;
            const currentScroll = selectionElement.scrollTop;
            const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
            
            console.log(`🔍 初始化箭頭檢查: maxScroll=${maxScroll}, currentScroll=${currentScroll}, currentRowIndex=${currentRowIndex}`);
            
            // 如果有內容需要滾動且當前在頂部，顯示箭頭提示
            if (maxScroll > 0 && currentRowIndex === 0 && currentScroll <= 5) { // 允許小誤差
                console.log('🎯 初始化時檢測到可滾動內容在頂部，顯示箭頭提示');
                showScrollDownArrow();
            } else {
                console.log(`❌ 初始化箭頭檢查未通過: 需要滾動=${maxScroll > 0}, 在頂部=${currentRowIndex === 0}, 滾動位置=${currentScroll}`);
            }
        }, 800); // 增加等待時間，確保所有動畫和佈局都完成

        // 清理事件監聽器
        selectionElement._scrollCleanup = () => {
            eventCleanupFunctions.forEach(fn => fn());
            
            // 清理定時器
            if (touchScrollTimeout) clearTimeout(touchScrollTimeout);
            if (scrollMonitorInterval) clearInterval(scrollMonitorInterval);
            if (velocityCheckInterval) clearInterval(velocityCheckInterval);
            
            console.log(`🧹 已清理元素 ${selectionElement.className} 的滾動控制`);
        };
    }

    // 查找並初始化所有標籤選擇區域
    function initializeAllScrollAreas() {
        const selectors = [
            '.axd_selections.selection',
            '.selection',
            '[class*="selection"]'
        ];

        let foundElements = 0;

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
                // 檢查是否包含標籤
                const hasTagContent = element.querySelector('.axd_selection') || 
                                     element.querySelector('.axd_tag') ||
                                     element.querySelector('[class*="tag"]');
                
                if (hasTagContent) {
                    console.log(`🔍 發現標籤容器: ${element.className}, 滾動高度: ${element.scrollHeight}, 可見高度: ${element.clientHeight}`);
                    enhanceScrollControl(element);
                    foundElements++;
                }
            });
            
            if (elements.length > 0) {
                console.log(`使用選擇器 "${selector}" 找到 ${elements.length} 個元素，其中 ${foundElements} 個包含標籤`);
                break; // 找到元素就停止
            }
        }

        if (foundElements === 0) {
            console.warn('⚠️  沒有找到任何包含標籤的滾動容器');
        } else {
            // 如果找到了新的滾動區域，延遲一點時間後檢查是否需要顯示箭頭
            setTimeout(() => {
                console.log('🔍 檢查新初始化的滾動區域是否需要顯示箭頭提示');
                // 不直接調用 showScrollDownArrow()，因為它會在 enhanceScrollControl 中處理
            }, 600);
        }
    }

    // 監聽DOM變化，動態初始化新出現的滾動區域
    function setupDynamicInitialization() {
        const observer = new MutationObserver((mutations) => {
            let shouldReinit = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const hasScrollableContent = node.querySelector('.axd_selections') ||
                                                       node.querySelector('.selection') ||
                                                       node.matches && node.matches('[class*="selection"]');
                            
                            if (hasScrollableContent) {
                                shouldReinit = true;
                            }
                        }
                    });
                }
                
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' &&
                    mutation.target.style.display !== 'none') {
                    const hasScrollableContent = mutation.target.querySelector('.axd_selections') ||
                                               mutation.target.querySelector('.selection');
                    if (hasScrollableContent) {
                        shouldReinit = true;
                    }
                }
            });
            
            if (shouldReinit) {
                setTimeout(() => {
                    console.log('🔄 檢測到新的滾動區域，重新初始化...');
                    initializeAllScrollAreas();
                    
                    // 在重新初始化後，檢查是否有新的容器需要顯示箭頭
                    setTimeout(() => {
                        console.log('🎯 動態初始化完成，檢查箭頭顯示需求');
                        // 箭頭顯示邏輯會在各個 enhanceScrollControl 中處理
                    }, 700);
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    // 初始化
    initializeAllScrollAreas();
    setupDynamicInitialization();
    
    // 處理頁面可見性變化
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('📱 頁面重新可見，重新初始化滾動控制...');
            setTimeout(() => {
                // 清除所有現有的增強滾動標記，強制重新初始化
                document.querySelectorAll('[data-enhanced-scroll="true"]').forEach(element => {
                    element.removeAttribute('data-enhanced-scroll');
                    console.log(`🧹 清除元素 ${element.className} 的增強滾動標記`);
                });
                
                // 重新初始化所有滾動區域
                initializeAllScrollAreas();
            }, 200); // 給一點時間讓頁面穩定
        } else {
            console.log('📱 頁面不可見，滾動控制將在返回時重新初始化');
        }
    }
    
    // 處理頁面焦點變化
    function handleFocusChange() {
        console.log('🔄 頁面重新獲得焦點，檢查滾動控制狀態...');
        setTimeout(() => {
            // 檢查現有的滾動控制是否還在工作
            const enhancedElements = document.querySelectorAll('[data-enhanced-scroll="true"]');
            let workingElements = 0;
            
            enhancedElements.forEach(element => {
                // 簡單檢查：看元素是否還在DOM中且可見
                if (element.isConnected && element.offsetParent !== null) {
                    workingElements++;
                } else {
                    element.removeAttribute('data-enhanced-scroll');
                    console.log(`🧹 清除無效元素 ${element.className} 的增強滾動標記`);
                }
            });
            
            console.log(`🔍 發現 ${enhancedElements.length} 個增強元素，其中 ${workingElements} 個正常工作`);
            
            // 如果沒有正常工作的元素，重新初始化
            if (workingElements === 0) {
                console.log('🔄 沒有正常工作的滾動控制，重新初始化...');
                initializeAllScrollAreas();
            }
        }, 300);
    }
    
    // 強制重新初始化函數
    function forceReinitialize() {
        console.log('🔄 強制重新初始化所有滾動控制...');
        
        // 清除所有現有標記
        document.querySelectorAll('[data-enhanced-scroll="true"]').forEach(element => {
            element.removeAttribute('data-enhanced-scroll');
        });
        
        // 重新初始化
        setTimeout(() => {
            initializeAllScrollAreas();
        }, 100);
    }
    
    // 添加事件監聽器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('pageshow', forceReinitialize); // 處理從bfcache恢復的情況
    
    // 定期檢查和修復機制（可選，用於處理極端情況）
    let healthCheckInterval = setInterval(() => {
        const enhancedElements = document.querySelectorAll('[data-enhanced-scroll="true"]');
        const selectionElements = document.querySelectorAll('.axd_selections.selection, .selection, [class*="selection"]');
        
        // 如果有選擇元素但沒有增強元素，說明可能出問題了
        if (selectionElements.length > 0 && enhancedElements.length === 0) {
            console.log('🏥 健康檢查：發現未增強的滾動元素，自動修復...');
            forceReinitialize();
        }
    }, 5000); // 每5秒檢查一次
    
    // 清理定時器（頁面卸載時）
    window.addEventListener('beforeunload', () => {
        clearInterval(healthCheckInterval);
    });
    
    console.log('✅ 增強滾動控制初始化完成');
});