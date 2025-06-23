document.addEventListener('DOMContentLoaded', () => {
    console.log('增強滾動控制啟動...');

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
            return; // 已經初始化過了
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

        // 滾輪事件處理
        selectionElement.addEventListener('wheel', (event) => {
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
            
            selectionElement.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }, { passive: false });

        // 觸摸滾動增強處理
        let touchScrollTimeout = null;
        let isUserScrolling = false;
        let lastScrollTime = 0;
        let touchStartY = 0;
        let isTouchScrolling = false;
        
        // 觸摸開始
        selectionElement.addEventListener('touchstart', (event) => {
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
        }, { passive: true });
        
        // 觸摸移動時的滾動處理
        selectionElement.addEventListener('touchmove', (event) => {
            if (!isTouchScrolling) return;
            
            const touchY = event.touches[0].clientY;
            const touchDelta = touchStartY - touchY;
            
            // 更新最後滾動時間
            lastScrollTime = Date.now();
            
            console.log(`👆 觸摸移動: ${touchDelta}px`);
        }, { passive: true });
        
        // 觸摸結束
        selectionElement.addEventListener('touchend', () => {
            console.log('👆 觸摸結束');
            isTouchScrolling = false;
            
            // 延遲一點時間來確保滾動停止
            setTimeout(() => {
                isUserScrolling = false;
                // 啟動速度追蹤來檢測慣性滾動
                startVelocityTracking();
            }, 50);
        }, { passive: true });

        // 改進的滾動事件處理
        selectionElement.addEventListener('scroll', () => {
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
                    console.log(`📱 滾動對齊: 從${currentScroll}px 對齊到行${currentRowIndex} (${targetScroll}px)`);
                    selectionElement.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                } else {
                    console.log(`📱 滾動位置已對齊: 行${currentRowIndex} (${currentScroll}px)`);
                }
            }, 100); // 減少延遲時間
        }, { passive: true });
        
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
                }, 300);
            } else {
                isAligning = false;
                console.log(`✅ 位置已對齊: 行${currentRowIndex} (${scrollTop}px)`);
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
        selectionElement.addEventListener('keydown', (event) => {
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
        });

        // 標記為已初始化
        selectionElement.setAttribute('data-enhanced-scroll', 'true');
        
        // 添加可訪問性屬性
        selectionElement.setAttribute('tabindex', '0');
        selectionElement.setAttribute('role', 'listbox');
        selectionElement.setAttribute('aria-label', '標籤選擇列表');
        
        console.log(`✅ 已為元素 ${selectionElement.className} 設置增強滾動控制 (總行數: ${totalRows}, 可見行數: ${visibleRows})`);
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
    
    console.log('✅ 增強滾動控制初始化完成');
}); 