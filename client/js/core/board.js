/**
 * Client Board Class
 * Quản lý trạng thái bàn cờ, ma trận buffs, nghĩa trang quân tử trận và buff đồng đội
 */
class ClientBoard {
  constructor() {
    this.grid = GameRules.createInitialBoard();
    this.buffs = GameRules.createInitialBuffs();
    this.graveyard = { RED: [], BLUE: [] };
    this.teamBuffs = { RED: { reviveReserve: 0 }, BLUE: { reviveReserve: 0 } };
    this.moveCount = 0;
  }

  reset() {
    this.grid = GameRules.createInitialBoard();
    this.buffs = GameRules.createInitialBuffs();
    this.graveyard = { RED: [], BLUE: [] };
    this.teamBuffs = { RED: { reviveReserve: 0 }, BLUE: { reviveReserve: 0 } };
    this.moveCount = 0;
  }

  setState(serverState) {
    if (Array.isArray(serverState)) {
      this.grid = GameRules.cloneBoard(serverState);
    } else if (serverState && serverState.grid) {
      this.grid = GameRules.cloneBoard(serverState.grid);
      if (serverState.buffs) {
        this.buffs = GameRules.cloneBuffs(serverState.buffs);
      }
      if (serverState.graveyard) {
        this.graveyard = {
          RED: [...(serverState.graveyard.RED || [])],
          BLUE: [...(serverState.graveyard.BLUE || [])]
        };
      }
      if (serverState.teamBuffs) {
        this.teamBuffs = JSON.parse(JSON.stringify(serverState.teamBuffs));
      }
    }
  }

  getPiece(row, col) {
    if (!GameRules.isValidPosition(row, col)) return null;
    return this.grid[row][col];
  }

  getBuff(row, col) {
    if (!GameRules.isValidPosition(row, col) || !this.buffs) return null;
    return this.buffs[row][col];
  }

  applyMove(from, to) {
    this.moveCount++;

    const result = GameRules.applyMoveWithBuffs(
      this.grid,
      this.buffs,
      this.graveyard,
      this.teamBuffs,
      from,
      to
    );

    // Kiểm tra cơ chế tự động sinh thêm buff nếu trên bàn cờ còn ít buff
    if (this.moveCount % 6 === 0) {
      const activeBuffs = this.countActiveBuffs();
      if (activeBuffs < 3) {
        const spawned = GameRules.spawnRandomBuff(this.grid, this.buffs);
        if (spawned) {
          result.spawnedBuff = spawned;
        }
      }
    }

    return result;
  }

  countActiveBuffs() {
    if (!this.buffs) return 0;
    let count = 0;
    for (let r = 0; r < GameRules.BOARD_SIZE; r++) {
      for (let c = 0; c < GameRules.BOARD_SIZE; c++) {
        if (this.buffs[r][c]) count++;
      }
    }
    return count;
  }

  getStats() {
    return GameRules.countPieces(this.grid);
  }
}
