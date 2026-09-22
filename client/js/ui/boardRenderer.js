/**
 * Board Renderer: Trình dựng giao diện bàn cờ 9x9 và hiển thị Buffs, hiệu ứng quân cờ
 */
class BoardRenderer {
  /**
   * @param {HTMLElement} containerElement 
   * @param {Function} onCellClickCallback 
   */
  constructor(containerElement, onCellClickCallback) {
    this.container = containerElement;
    this.onCellClick = onCellClickCallback;
    this.cellElements = []; // Ma trận [9][9] lưu DOM elements
    this.isFlipped = false;  // Góc nhìn (Lật bàn cờ)

    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = '';

    // Khung bàn cờ
    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'board-wrapper';

    // Toạ độ hàng trên (a - i)
    const topCoords = document.createElement('div');
    topCoords.className = 'coords-row';
    this._renderColHeaders(topCoords);
    boardWrapper.appendChild(topCoords);

    // Lưới 9x9
    const grid = document.createElement('div');
    grid.className = 'board-grid';

    this.cellElements = Array.from({ length: CONFIG.BOARD_SIZE }, () =>
      Array.from({ length: CONFIG.BOARD_SIZE }, () => null)
    );

    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
      for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Đánh dấu ô căn cứ
        if (r === GameRules.BASES.RED.row && c === GameRules.BASES.RED.col) {
          cell.classList.add('base-red');
        } else if (r === GameRules.BASES.BLUE.row && c === GameRules.BASES.BLUE.col) {
          cell.classList.add('base-blue');
        }

        cell.addEventListener('click', () => {
          if (typeof this.onCellClick === 'function') {
            this.onCellClick(parseInt(cell.dataset.row, 10), parseInt(cell.dataset.col, 10));
          }
        });

        this.cellElements[r][c] = cell;
        grid.appendChild(cell);
      }
    }

    boardWrapper.appendChild(grid);

    // Toạ độ hàng dưới (a - i)
    const bottomCoords = document.createElement('div');
    bottomCoords.className = 'coords-row';
    this._renderColHeaders(bottomCoords);
    boardWrapper.appendChild(bottomCoords);

    this.container.appendChild(boardWrapper);
  }

  _renderColHeaders(container) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const cols = this.isFlipped ? [...letters].reverse() : letters;
    cols.forEach(letter => {
      const span = document.createElement('span');
      span.textContent = letter;
      container.appendChild(span);
    });
  }

  /**
   * Cập nhật toàn bộ giao diện bàn cờ từ ma trận quân cờ và ma trận Buffs
   * @param {Array<Array<Object|null>>} boardGrid 
   * @param {Array<Array<string|null>>} [buffsGrid]
   */
  renderBoard(boardGrid, buffsGrid = null) {
    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
      for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
        const cellDom = this.cellElements[r][c];
        const pieceData = boardGrid[r][c];
        const buffType = buffsGrid ? buffsGrid[r][c] : null;

        cellDom.innerHTML = '';

        // 1. Render Buff trên ô (nếu có và ô chưa có quân cờ)
        if (buffType && !pieceData) {
          const buffInfo = GameRules.BUFF_INFO[buffType];
          const buffDiv = document.createElement('div');
          buffDiv.className = `board-buff buff-${buffType.toLowerCase()}`;
          buffDiv.textContent = buffInfo ? buffInfo.symbol : '⭐';
          buffDiv.title = buffInfo ? `${buffInfo.name}: ${buffInfo.desc}` : buffType;
          cellDom.appendChild(buffDiv);
        }

        // 2. Render Quân cờ (nếu có)
        if (pieceData) {
          const pieceDiv = document.createElement('div');
          pieceDiv.className = `piece ${pieceData.side.toLowerCase()}`;

          // Kiểm tra hiệu ứng Buff của quân cờ
          if (pieceData.shield && pieceData.shield > 0) {
            pieceDiv.classList.add('has-shield');
            const shieldBadge = document.createElement('div');
            shieldBadge.className = 'piece-badge-shield';
            shieldBadge.textContent = '🛡️';
            shieldBadge.title = 'Có Khiên Thêm Mạng: Chặn 1 đòn chí mạng!';
            pieceDiv.appendChild(shieldBadge);
          }

          if (pieceData.doubleStepCharges && pieceData.doubleStepCharges > 0) {
            pieceDiv.classList.add('has-speed');
            const speedBadge = document.createElement('div');
            speedBadge.className = 'piece-badge-speed';
            speedBadge.textContent = '⚡';
            speedBadge.title = `Tốc Hành: Có thể đi 2 ô (còn ${pieceData.doubleStepCharges} lượt)`;
            pieceDiv.appendChild(speedBadge);
          }

          const img = document.createElement('img');
          img.src = CONFIG.PIECE_ASSETS[pieceData.side][pieceData.type];
          img.alt = `${pieceData.side} ${pieceData.type}`;
          img.draggable = false;

          pieceDiv.appendChild(img);
          cellDom.appendChild(pieceDiv);
        }
      }
    }
  }

  /**
   * Đánh dấu ô đang được chọn
   */
  highlightSelected(row, col) {
    this.clearHighlights();
    if (row !== null && col !== null && this.cellElements[row] && this.cellElements[row][col]) {
      this.cellElements[row][col].classList.add('selected');
    }
  }

  /**
   * Đánh dấu các ô đi được hợp lệ (Gợi ý 8 hướng, hỗ trợ cự ly 1 ô và 2 ô)
   * @param {Array<{row: number, col: number, isCapture: boolean, step?: number}>} validMoves 
   */
  showValidMoves(validMoves) {
    validMoves.forEach(m => {
      const cellDom = this.cellElements[m.row][m.col];
      if (cellDom) {
        if (m.isCapture) {
          cellDom.classList.add('valid-capture');
        } else {
          cellDom.classList.add('valid-move');
        }

        // Đánh dấu cự ly 2 ô
        if (m.step === 2) {
          cellDom.classList.add('step-2');
        }
      }
    });
  }

  /**
   * Đánh dấu nước đi vừa thực hiện (Last move)
   */
  highlightLastMove(from, to) {
    // Xoá highlight cũ
    document.querySelectorAll('.last-move-from, .last-move-to').forEach(el => {
      el.classList.remove('last-move-from', 'last-move-to');
    });

    if (from && this.cellElements[from.row] && this.cellElements[from.row][from.col]) {
      this.cellElements[from.row][from.col].classList.add('last-move-from');
    }
    if (to && this.cellElements[to.row] && this.cellElements[to.row][to.col]) {
      this.cellElements[to.row][to.col].classList.add('last-move-to');
    }
  }

  /**
   * Xoá mọi hiệu ứng highlight chọn/gợi ý
   */
  clearHighlights() {
    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
      for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
        this.cellElements[r][c].classList.remove('selected', 'valid-move', 'valid-capture', 'step-2');
      }
    }
  }
}
