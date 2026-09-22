/**
 * Lớp quản lý bàn cờ 9x9 của OTTv2 phía Server (Tích hợp Buffs, Graveyard, TeamBuffs)
 */
const {
  BOARD_SIZE,
  createInitialBoard,
  createInitialBuffs,
  cloneBuffs,
  isValidPosition,
  cloneBoard,
  countPieces,
  applyMoveWithBuffs,
  spawnRandomBuff
} = require('../../shared/gameRules');

class Board {
  constructor() {
    this.grid = createInitialBoard();
    this.buffs = createInitialBuffs();
    this.graveyard = { RED: [], BLUE: [] };
    this.teamBuffs = { RED: { reviveReserve: 0 }, BLUE: { reviveReserve: 0 } };
    this.moveCount = 0;
  }

  /**
   * Đặt lại bàn cờ về vị trí ban đầu
   */
  reset() {
    this.grid = createInitialBoard();
    this.buffs = createInitialBuffs();
    this.graveyard = { RED: [], BLUE: [] };
    this.teamBuffs = { RED: { reviveReserve: 0 }, BLUE: { reviveReserve: 0 } };
    this.moveCount = 0;
  }

  /**
   * Lấy quân cờ tại toạ độ (row, col)
   * @param {number} row 
   * @param {number} col 
   * @returns {Object|null}
   */
  getPiece(row, col) {
    if (!isValidPosition(row, col)) return null;
    return this.grid[row][col];
  }

  /**
   * Đặt quân cờ vào toạ độ (row, col)
   * @param {number} row 
   * @param {number} col 
   * @param {Object|null} piece 
   */
  setPiece(row, col, piece) {
    if (!isValidPosition(row, col)) return false;
    this.grid[row][col] = piece;
    return true;
  }

  /**
   * Thực hiện di chuyển quân cờ từ (fromRow, fromCol) đến (toRow, toCol)
   * Tích hợp Buffs, Khiên bảo vệ, Hồi sinh
   * @param {number} fromRow 
   * @param {number} fromCol 
   * @param {number} toRow 
   * @param {number} toCol 
   * @returns {Object|null}
   */
  movePiece(fromRow, fromCol, toRow, toCol) {
    if (!isValidPosition(fromRow, fromCol) || !isValidPosition(toRow, toCol)) {
      return null;
    }

    const movedPiece = this.grid[fromRow][fromCol];
    if (!movedPiece) return null;

    this.moveCount++;

    const result = applyMoveWithBuffs(
      this.grid,
      this.buffs,
      this.graveyard,
      this.teamBuffs,
      { row: fromRow, col: fromCol },
      { row: toRow, col: toCol }
    );

    // Tự động sinh buff mới nếu ít hơn 3 buff trên bàn
    if (this.moveCount % 6 === 0) {
      let activeBuffs = 0;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (this.buffs[r][c]) activeBuffs++;
        }
      }
      if (activeBuffs < 3) {
        const spawned = spawnRandomBuff(this.grid, this.buffs);
        if (spawned) {
          result.spawnedBuff = spawned;
        }
      }
    }

    return result;
  }

  /**
   * Lấy bản sao trạng thái bàn cờ hiện tại đầy đủ
   * @returns {{grid: Array, buffs: Array, graveyard: Object, teamBuffs: Object}}
   */
  getState() {
    return {
      grid: cloneBoard(this.grid),
      buffs: cloneBuffs(this.buffs),
      graveyard: {
        RED: [...this.graveyard.RED],
        BLUE: [...this.graveyard.BLUE]
      },
      teamBuffs: JSON.parse(JSON.stringify(this.teamBuffs))
    };
  }

  /**
   * Đếm số lượng quân của mỗi bên
   */
  getStats() {
    return countPieces(this.grid);
  }
}

module.exports = Board;
