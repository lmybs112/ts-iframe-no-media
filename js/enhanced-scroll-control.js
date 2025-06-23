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

        // 觸摸滾動結束後的對齊處理
        let touchScrollTimeout = null;
        
        selectionElement.addEventListener('scroll', () => {
            clearTimeout(touchScrollTimeout);
            
            touchScrollTimeout = setTimeout(() => {
                const currentScroll = selectionElement.scrollTop;
                const currentRowIndex = getCurrentRowIndex(currentScroll, rowHeight);
                const targetScroll = getTargetScrollPosition(currentRowIndex, rowHeight, 
                    selectionElement.scrollHeight - selectionElement.clientHeight);
                
                // 如果當前位置與目標位置差距較大，則進行對齊
                if (Math.abs(currentScroll - targetScroll) > 5) {
                    console.log(`觸摸滾動對齊: 從${currentScroll}px 對齊到行${currentRowIndex} (${targetScroll}px)`);
                    selectionElement.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                }
            }, 150); // 等待滾動停止後再對齊
        }, { passive: true });

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