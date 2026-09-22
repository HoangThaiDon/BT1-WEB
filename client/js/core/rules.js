/**
 * Client Rules & AI Logic Helper
 */
class ClientRules {
  /**
   * Lấy các nước đi hợp lệ của 1 ô
   */
  static getValidMoves(boardGrid, row, col) {
    return GameRules.getValidMoves(boardGrid, row, col);
  }

  /**
   * Lấy toàn bộ nước đi hợp lệ của một phe
   */
  static getAllValidMoves(boardGrid, side) {
    return GameRules.getAllValidMoves(boardGrid, side);
  }

  /**
   * Kiểm tra điều kiện thắng/thua
   */
  static checkGameOver(boardGrid, nextTurnSide) {
    return GameRules.checkGameOver(boardGrid, nextTurnSide);
  }

  /**
   * Thuật toán AI Bot lựa chọn nước đi thông minh
   * Có tích hợp tính toán nhặt Buffs (Shield, Revive, Double Step) và tận dụng bước nhảy 2 ô
   * 
   * @param {Array<Array<Object|null>>} boardGrid 
   * @param {string} botSide - Thường là 'BLUE'
   * @param {Array<Array<string|null>>} [buffsGrid]
   * @param {Object} [graveyard]
   * @returns {{ from: {row, col}, to: {row, col} } | null}
   */
  static getBestAiMove(boardGrid, botSide, buffsGrid = null, graveyard = null) {
    const allMoves = GameRules.getAllValidMoves(boardGrid, botSide);
    if (allMoves.length === 0) return null;

    const targetBase = botSide === GameRules.SIDES.BLUE ? GameRules.BASES.RED : GameRules.BASES.BLUE;

    // Đánh giá điểm số cho từng nước đi:
    const scoredMoves = allMoves.map(move => {
      let score = 0;

      // 1. Nếu đi vào chiếm được căn cứ đối phương -> Ưu tiên tuyệt đối (+1000 điểm)
      if (move.to.row === targetBase.row && move.to.col === targetBase.col) {
        score += 1000;
      }

      // 2. Nếu ăn được quân đối phương
      if (move.isCapture) {
        const targetPiece = boardGrid[move.to.row][move.to.col];
        if (targetPiece && targetPiece.shield && targetPiece.shield > 0) {
          // Đối phương có khiên -> Đòn đánh phá vỡ khiên nhưng chưa giết được
          score += 25;
        } else {
          score += 55;
        }
      }

      // 3. Đánh giá nhặt Buff trên bàn cờ
      if (buffsGrid && buffsGrid[move.to.row] && buffsGrid[move.to.row][move.to.col]) {
        const buffType = buffsGrid[move.to.row][move.to.col];
        if (buffType === GameRules.BUFF_TYPES.SHIELD) {
          score += 40; // Nhặt khiên cực kỳ an toàn
        } else if (buffType === GameRules.BUFF_TYPES.REVIVE) {
          const hasFallen = graveyard && graveyard[botSide] && graveyard[botSide].length > 0;
          score += hasFallen ? 60 : 25; // Ưu tiên rất cao nếu đã mất quân
        } else if (buffType === GameRules.BUFF_TYPES.DOUBLE_STEP) {
          score += 35; // Tăng tầm di chuyển
        }
      }

      // 4. Tiến gần hơn tới căn cứ mục tiêu (khoảng cách Manhattan)
      const currentDist = Math.abs(move.from.row - targetBase.row) + Math.abs(move.from.col - targetBase.col);
      const nextDist = Math.abs(move.to.row - targetBase.row) + Math.abs(move.to.col - targetBase.col);
      if (nextDist < currentDist) {
        score += 12;
      }

      // 5. Tránh bị ăn ở ô đích (giả lập 1 bước tiếp theo)
      const simulatedBoard = GameRules.cloneBoard(boardGrid);
      simulatedBoard[move.to.row][move.to.col] = move.piece;
      simulatedBoard[move.from.row][move.from.col] = null;

      const oppSide = botSide === GameRules.SIDES.BLUE ? GameRules.SIDES.RED : GameRules.SIDES.BLUE;
      const oppResponses = GameRules.getAllValidMoves(simulatedBoard, oppSide);
      const willBeCaptured = oppResponses.some(oppMove => oppMove.to.row === move.to.row && oppMove.to.col === move.to.col);

      if (willBeCaptured) {
        if (move.piece && move.piece.shield && move.piece.shield > 0) {
          score -= 15; // Có khiên bảo vệ nên bớt sợ bị ăn
        } else {
          score -= 45; // Tránh nguy cơ tử trận
        }
      }

      // Thêm chút ngẫu nhiên để Bot không đi theo lối mòn
      score += Math.random() * 5;

      return { move, score };
    });

    // Sắp xếp điểm giảm dần và chọn nước tốt nhất
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }
}
