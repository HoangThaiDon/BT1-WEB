/**
 * OTTv2 (Oẳn Tù Tì v2) - Shared Game Engine & Rules Module
 * Tương thích cả Node.js (CommonJS/Backend) và Browser (UMD/Frontend)
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GameRules = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1. HẰNG SỐ CƠ BẢN
  const BOARD_SIZE = 9;

  const SIDES = Object.freeze({
    RED: 'RED',
    BLUE: 'BLUE'
  });

  const PIECE_TYPES = Object.freeze({
    ROCK: 'ROCK',         // Đấm / Búa
    PAPER: 'PAPER',       // Lá / Bao
    SCISSORS: 'SCISSORS'  // Kéo
  });

  // Tọa độ căn cứ (Base)
  // row 8: hàng 1, col 0: cột a -> a1 (Red Base)
  // row 0: hàng 9, col 8: cột i -> i9 (Blue Base)
  const BASES = Object.freeze({
    RED: { row: 8, col: 0, notation: 'a1' },
    BLUE: { row: 0, col: 8, notation: 'i9' }
  });

  // 8 hướng di chuyển (4 trực giao + 4 chéo)
  const DIRECTIONS = Object.freeze([
    { dr: -1, dc: 0, name: 'UP' },
    { dr: 1, dc: 0, name: 'DOWN' },
    { dr: 0, dc: -1, name: 'LEFT' },
    { dr: 0, dc: 1, name: 'RIGHT' },
    { dr: -1, dc: -1, name: 'UP_LEFT' },
    { dr: -1, dc: 1, name: 'UP_RIGHT' },
    { dr: 1, dc: -1, name: 'DOWN_LEFT' },
    { dr: 1, dc: 1, name: 'DOWN_RIGHT' }
  ]);

  // Quy tắc khắc chế Oẳn Tù Tì
  const BEATS = Object.freeze({
    [PIECE_TYPES.ROCK]: PIECE_TYPES.SCISSORS,   // Đấm ăn Kéo
    [PIECE_TYPES.SCISSORS]: PIECE_TYPES.PAPER,  // Kéo ăn Lá
    [PIECE_TYPES.PAPER]: PIECE_TYPES.ROCK      // Lá ăn Đấm
  });

  // Hằng số các loại Buff trên bàn cờ
  const BUFF_TYPES = Object.freeze({
    SHIELD: 'SHIELD',           // Thêm mạng (Khiên hộ mệnh)
    REVIVE: 'REVIVE',           // Hồi sinh đồng đội
    DOUBLE_STEP: 'DOUBLE_STEP'  // Tốc hành đi 2 ô
  });

  const BUFF_INFO = Object.freeze({
    [BUFF_TYPES.SHIELD]: {
      id: 'SHIELD',
      name: 'Thêm Mạng',
      symbol: '🛡️',
      color: '#38bdf8',
      desc: 'Chặn 1 đòn chí mạng từ đối phương, giữ quân an toàn'
    },
    [BUFF_TYPES.REVIVE]: {
      id: 'REVIVE',
      name: 'Hồi Sinh Đồng Đội',
      symbol: '✨',
      color: '#34d399',
      desc: 'Hồi sinh 1 quân cờ đã tử trận về căn cứ'
    },
    [BUFF_TYPES.DOUBLE_STEP]: {
      id: 'DOUBLE_STEP',
      name: 'Đi 2 Ô',
      symbol: '⚡',
      color: '#fbbf24',
      desc: 'Tăng tầm di chuyển lên tối đa 2 ô theo 8 hướng'
    }
  });

  /**
   * Kiểm tra quân tấn công có ăn được quân bị tấn công không
   * @param {string} attackerType - Loại quân tấn công (ROCK/PAPER/SCISSORS)
   * @param {string} defenderType - Loại quân bị tấn công
   * @returns {boolean}
   */
  function canCapture(attackerType, defenderType) {
    if (!attackerType || !defenderType) return false;
    return BEATS[attackerType] === defenderType;
  }

  /**
   * Kiểm tra tọa độ có nằm trong bàn cờ 9x9 không
   * @param {number} r - Row (0-8)
   * @param {number} c - Col (0-8)
   * @returns {boolean}
   */
  function isValidPosition(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  /**
   * Chuyển đổi toạ độ (row, col) sang ký hiệu cờ (ví dụ: row 8, col 0 -> a1)
   * @param {number} row 
   * @param {number} col 
   * @returns {string}
   */
  function posToNotation(row, col) {
    if (!isValidPosition(row, col)) return '??';
    const colLetter = String.fromCharCode(97 + col); // 0 -> 'a'
    const rowNumber = 9 - row;                      // 0 -> 9, 8 -> 1
    return `${colLetter}${rowNumber}`;
  }

  /**
   * Chuyển đổi ký hiệu cờ sang toạ độ {row, col} (ví dụ: a1 -> {row: 8, col: 0})
   * @param {string} notation 
   * @returns {{row: number, col: number}|null}
   */
  function notationToPos(notation) {
    if (typeof notation !== 'string' || notation.length !== 2) return null;
    const colLetter = notation[0].toLowerCase();
    const rowNumber = parseInt(notation[1], 10);
    const col = colLetter.charCodeAt(0) - 97;
    const row = 9 - rowNumber;
    if (!isValidPosition(row, col)) return null;
    return { row, col };
  }

  /**
   * Khởi tạo bàn cờ 9x9 với vị trí mặc định của 2 phe
   * @returns {Array<Array<Object|null>>}
   */
  function createInitialBoard() {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );

    let idCounter = 1;
    const createPiece = (type, side) => ({
      id: `${side[0].toLowerCase()}_${type[0].toLowerCase()}_${idCounter++}`,
      type,
      side
    });

    // --- KHỞI TẠO PHE XANH (BLUE) Ở HÀNG TRÊN (row 0 và row 1) ---
    // Row 0 (rank 9): b9, d9, f9, h9 (i9 là căn cứ Xanh - để trống)
    board[0][1] = createPiece(PIECE_TYPES.ROCK, SIDES.BLUE);     // b9
    board[0][3] = createPiece(PIECE_TYPES.PAPER, SIDES.BLUE);    // d9
    board[0][5] = createPiece(PIECE_TYPES.SCISSORS, SIDES.BLUE); // f9
    board[0][7] = createPiece(PIECE_TYPES.ROCK, SIDES.BLUE);     // h9

    // Row 1 (rank 8): a8, c8, e8, g8, i8
    board[1][0] = createPiece(PIECE_TYPES.PAPER, SIDES.BLUE);    // a8
    board[1][2] = createPiece(PIECE_TYPES.SCISSORS, SIDES.BLUE); // c8
    board[1][4] = createPiece(PIECE_TYPES.ROCK, SIDES.BLUE);     // e8
    board[1][6] = createPiece(PIECE_TYPES.PAPER, SIDES.BLUE);    // g8
    board[1][8] = createPiece(PIECE_TYPES.SCISSORS, SIDES.BLUE); // i8

    // --- KHỞI TẠO PHE ĐỎ (RED) Ở HÀNG DƯỚI (row 7 và row 8) ---
    // Row 7 (rank 2): a2, c2, e2, g2, i2
    board[7][0] = createPiece(PIECE_TYPES.SCISSORS, SIDES.RED);  // a2
    board[7][2] = createPiece(PIECE_TYPES.PAPER, SIDES.RED);     // c2
    board[7][4] = createPiece(PIECE_TYPES.ROCK, SIDES.RED);      // e2
    board[7][6] = createPiece(PIECE_TYPES.SCISSORS, SIDES.RED);  // g2
    board[7][8] = createPiece(PIECE_TYPES.PAPER, SIDES.RED);     // i2

    // Row 8 (rank 1): b1, d1, f1, h1 (a1 là căn cứ Đỏ - để trống)
    board[8][1] = createPiece(PIECE_TYPES.ROCK, SIDES.RED);      // b1
    board[8][3] = createPiece(PIECE_TYPES.SCISSORS, SIDES.RED);  // d1
    board[8][5] = createPiece(PIECE_TYPES.PAPER, SIDES.RED);     // f1
    board[8][7] = createPiece(PIECE_TYPES.ROCK, SIDES.RED);      // h1

    return board;
  }

  /**
   * Khởi tạo bảng buff 9x9 với 6 buff mặc định bố trí đối xứng chiến thuật
   * @returns {Array<Array<string|null>>}
   */
  function createInitialBuffs() {
    const buffs = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );

    // 6 Buff đặt đối xứng chiến thuật trên bàn cờ ở hàng 3 và hàng 5:
    // Hàng 3 (gần Xanh):
    buffs[3][2] = BUFF_TYPES.SHIELD;       // c6 (Shield)
    buffs[3][4] = BUFF_TYPES.DOUBLE_STEP;  // e6 (Đi 2 ô)
    buffs[3][6] = BUFF_TYPES.REVIVE;       // g6 (Hồi sinh)

    // Hàng 5 (gần Đỏ):
    buffs[5][2] = BUFF_TYPES.REVIVE;       // c4 (Hồi sinh)
    buffs[5][4] = BUFF_TYPES.DOUBLE_STEP;  // e4 (Đi 2 ô)
    buffs[5][6] = BUFF_TYPES.SHIELD;       // g4 (Shield)

    return buffs;
  }

  /**
   * Bản sao sâu của ma trận buff
   * @param {Array<Array<string|null>>} buffs 
   * @returns {Array<Array<string|null>>}
   */
  function cloneBuffs(buffs) {
    if (!buffs) return createInitialBuffs();
    return buffs.map(row => [...row]);
  }

  /**
   * Lấy danh sách các nước đi hợp lệ của 1 quân tại (fromRow, fromCol)
   * Có tính đến buff Đi 2 ô (nếu piece.doubleStepCharges > 0)
   * @param {Array<Array<Object|null>>} board 
   * @param {number} fromRow 
   * @param {number} fromCol 
   * @returns {Array<{row: number, col: number, isCapture: boolean, targetPiece: Object|null, step: number}>}
   */
  function getValidMoves(board, fromRow, fromCol) {
    if (!isValidPosition(fromRow, fromCol)) return [];
    const piece = board[fromRow][fromCol];
    if (!piece) return [];

    const validMoves = [];
    const maxSteps = (piece.doubleStepCharges && piece.doubleStepCharges > 0) ? 2 : 1;

    for (const dir of DIRECTIONS) {
      for (let step = 1; step <= maxSteps; step++) {
        const toRow = fromRow + dir.dr * step;
        const toCol = fromCol + dir.dc * step;

        if (!isValidPosition(toRow, toCol)) break;

        const targetPiece = board[toRow][toCol];

        if (!targetPiece) {
          // Ô trống: Đi được
          validMoves.push({
            row: toRow,
            col: toCol,
            isCapture: false,
            targetPiece: null,
            step: step
          });
        } else {
          // Ô có quân:
          if (targetPiece.side === piece.side) {
            // Cùng phe: Không thể đi vào hoặc nhảy qua
            break;
          } else {
            // Khác phe: Kiểm tra luật Oẳn Tù Tì
            if (canCapture(piece.type, targetPiece.type)) {
              validMoves.push({
                row: toRow,
                col: toCol,
                isCapture: true,
                targetPiece: targetPiece,
                step: step
              });
            }
            // Không thể đi xuyên qua quân đối phương
            break;
          }
        }
      }
    }

    return validMoves;
  }

  /**
   * Lấy toàn bộ các nước đi hợp lệ của một phe trên toàn bàn cờ
   * @param {Array<Array<Object|null>>} board 
   * @param {string} side - 'RED' hoặc 'BLUE'
   * @returns {Array<{from: {row: number, col: number}, to: {row: number, col: number}, isCapture: boolean, piece: Object}>}
   */
  function getAllValidMoves(board, side) {
    const allMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (piece && piece.side === side) {
          const moves = getValidMoves(board, r, c);
          for (const m of moves) {
            allMoves.push({
              from: { row: r, col: c },
              to: { row: m.row, col: m.col },
              isCapture: m.isCapture,
              piece: piece
            });
          }
        }
      }
    }
    return allMoves;
  }

  /**
   * Đếm số lượng quân của mỗi bên trên bàn cờ
   * @param {Array<Array<Object|null>>} board 
   * @returns {{ RED: number, BLUE: number, pieces: { RED: Array, BLUE: Array } }}
   */
  function countPieces(board) {
    let redCount = 0;
    let blueCount = 0;
    const redPieces = [];
    const bluePieces = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.side === SIDES.RED) {
            redCount++;
            redPieces.push({ piece, pos: { row: r, col: c } });
          } else if (piece.side === SIDES.BLUE) {
            blueCount++;
            bluePieces.push({ piece, pos: { row: r, col: c } });
          }
        }
      }
    }

    return {
      RED: redCount,
      BLUE: blueCount,
      pieces: { RED: redPieces, BLUE: bluePieces }
    };
  }

  /**
   * Kiểm tra điều kiện kết thúc trò chơi
   * @param {Array<Array<Object|null>>} board 
   * @param {string} nextTurnSide - Phe chuẩn bị đi tiếp theo
   * @returns {{ isGameOver: boolean, winner: string|null, reason: string|null, message: string }}
   */
  function checkGameOver(board, nextTurnSide) {
    // 1. Kiểm tra Chiếm căn cứ (Base Invasion)
    // Red Base: a1 (row 8, col 0). Nếu có quân BLUE ở đây -> BLUE thắng.
    const redBaseCell = board[BASES.RED.row][BASES.RED.col];
    if (redBaseCell && redBaseCell.side === SIDES.BLUE) {
      return {
        isGameOver: true,
        winner: SIDES.BLUE,
        reason: 'BASE_INVADED',
        message: 'Phe Xanh đã chiếm căn cứ a1 của Đỏ và giành chiến thắng!'
      };
    }

    // Blue Base: i9 (row 0, col 8). Nếu có quân RED ở đây -> RED thắng.
    const blueBaseCell = board[BASES.BLUE.row][BASES.BLUE.col];
    if (blueBaseCell && blueBaseCell.side === SIDES.RED) {
      return {
        isGameOver: true,
        winner: SIDES.RED,
        reason: 'BASE_INVADED',
        message: 'Phe Đỏ đã chiếm căn cứ i9 của Xanh và giành chiến thắng!'
      };
    }

    // 2. Kiểm tra Ăn hết quân (Annihilation)
    const counts = countPieces(board);
    if (counts.RED === 0) {
      return {
        isGameOver: true,
        winner: SIDES.BLUE,
        reason: 'ALL_PIECES_CAPTURED',
        message: 'Phe Đỏ đã bị tiêu diệt toàn bộ quân! Phe Xanh thắng cuộc!'
      };
    }
    if (counts.BLUE === 0) {
      return {
        isGameOver: true,
        winner: SIDES.RED,
        reason: 'ALL_PIECES_CAPTURED',
        message: 'Phe Xanh đã bị tiêu diệt toàn bộ quân! Phe Đỏ thắng cuộc!'
      };
    }

    // 3. Kiểm tra Hết nước đi hợp lệ (No Valid Moves)
    if (nextTurnSide) {
      const nextMoves = getAllValidMoves(board, nextTurnSide);
      if (nextMoves.length === 0) {
        const winner = nextTurnSide === SIDES.RED ? SIDES.BLUE : SIDES.RED;
        return {
          isGameOver: true,
          winner: winner,
          reason: 'NO_VALID_MOVES',
          message: `Phe ${nextTurnSide === SIDES.RED ? 'Đỏ' : 'Xanh'} không còn nước đi hợp lệ! Phe ${winner === SIDES.RED ? 'Đỏ' : 'Xanh'} thắng cuộc!`
        };
      }
    }

    return {
      isGameOver: false,
      winner: null,
      reason: null,
      message: ''
    };
  }

  /**
   * Tạo bản sao sâu của bàn cờ
   * @param {Array<Array<Object|null>>} board 
   * @returns {Array<Array<Object|null>>}
   */
  /**
   * Tạo bản sao sâu của bàn cờ
   * @param {Array<Array<Object|null>>} board 
   * @returns {Array<Array<Object|null>>}
   */
  function cloneBoard(board) {
    return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  }

  /**
   * Tìm vị trí xuất hiện thích hợp nhất để hồi sinh quân cờ
   * Ưu tiên: Căn cứ chính -> Hàng 1 gần căn cứ -> Hàng 2 -> Bất kỳ ô trống
   * @param {Array<Array<Object|null>>} board 
   * @param {string} side 
   * @returns {{row: number, col: number}|null}
   */
  function findSpawnPositionForSide(board, side) {
    const base = side === SIDES.RED ? BASES.RED : BASES.BLUE;
    // 1. Kiểm tra căn cứ chính
    if (!board[base.row][base.col]) {
      return { row: base.row, col: base.col };
    }

    // 2. Tìm trong hàng xuất phát (hàng 8 cho Đỏ, hàng 0 cho Xanh)
    const homeRow = side === SIDES.RED ? 8 : 0;
    const colOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    colOrder.sort((a, b) => Math.abs(a - base.col) - Math.abs(b - base.col));

    for (const c of colOrder) {
      if (!board[homeRow][c]) {
        return { row: homeRow, col: c };
      }
    }

    // 3. Tìm trong hàng kế cận (hàng 7 cho Đỏ, hàng 1 cho Xanh)
    const rank2Row = side === SIDES.RED ? 7 : 1;
    for (const c of colOrder) {
      if (!board[rank2Row][c]) {
        return { row: rank2Row, col: c };
      }
    }

    // 4. Tìm ô trống bất kỳ
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!board[r][c]) {
          return { row: r, col: c };
        }
      }
    }

    return null;
  }

  /**
   * Áp dụng nước đi tích hợp toàn bộ hệ thống Buffs:
   * - Nhặt Buff (Shield, Revive, Double Step)
   * - Khiên hộ mệnh chống bị ăn quân
   * - Hồi sinh quân tử trận
   * - Tiêu hao charge đi 2 ô
   * 
   * @param {Array<Array<Object|null>>} board - Ma trận quân cờ
   * @param {Array<Array<string|null>>} buffs - Ma trận buff
   * @param {Object} graveyard - { RED: Array, BLUE: Array }
   * @param {Object} teamBuffs - { RED: { reviveReserve: number }, BLUE: { reviveReserve: number } }
   * @param {Object} from - { row, col }
   * @param {Object} to - { row, col }
   * @returns {Object} Kết quả chi tiết của nước đi
   */
  function applyMoveWithBuffs(board, buffs, graveyard, teamBuffs, from, to) {
    const movedPiece = board[from.row][from.col];
    if (!movedPiece) return null;

    const targetPiece = board[to.row][to.col];
    let collectedBuff = null;
    let shieldDefended = false;
    let capturedPiece = null;
    let revivedPiece = null;
    let revivePos = null;
    let usedReviveReserve = false;

    // 1. Kiểm tra nếu ô đích có quân địch (Tấn công)
    if (targetPiece && targetPiece.side !== movedPiece.side) {
      // Kiểm tra xem quân địch có Khiên Thêm Mạng (Shield) không
      if (targetPiece.shield && targetPiece.shield > 0) {
        // Khiên kích hoạt đỡ đòn!
        targetPiece.shield -= 1;
        shieldDefended = true;

        // Tiêu hao 1 charge đi 2 ô của quân tấn công nếu có
        if (movedPiece.doubleStepCharges && movedPiece.doubleStepCharges > 0) {
          movedPiece.doubleStepCharges -= 1;
        }

        return {
          movedPiece,
          capturedPiece: null,
          shieldDefended: true,
          collectedBuff: null,
          revivedPiece: null,
          revivePos: null,
          usedReviveReserve: false,
          pieceMoved: false
        };
      } else {
        // Ăn quân bình thường
        capturedPiece = targetPiece;

        // Kiểm tra xem phe bị ăn có Vé Hồi Sinh Dự Trữ không
        if (teamBuffs && teamBuffs[targetPiece.side] && teamBuffs[targetPiece.side].reviveReserve > 0) {
          teamBuffs[targetPiece.side].reviveReserve -= 1;
          usedReviveReserve = true;
          // Tự động hồi sinh ngay lập tức tại căn cứ!
          const spawn = findSpawnPositionForSide(board, targetPiece.side);
          if (spawn) {
            targetPiece.shield = 0;
            targetPiece.doubleStepCharges = 0;
            board[spawn.row][spawn.col] = targetPiece;
            revivedPiece = targetPiece;
            revivePos = spawn;
          } else if (graveyard && graveyard[targetPiece.side]) {
            graveyard[targetPiece.side].push(targetPiece);
          }
        } else if (graveyard && graveyard[targetPiece.side]) {
          graveyard[targetPiece.side].push(targetPiece);
        }
      }
    }

    // 2. Thực hiện di chuyển quân trên bàn cờ
    board[to.row][to.col] = movedPiece;
    board[from.row][from.col] = null;

    // Tiêu hao 1 charge đi 2 ô nếu có
    if (movedPiece.doubleStepCharges && movedPiece.doubleStepCharges > 0) {
      movedPiece.doubleStepCharges -= 1;
    }

    // 3. Kiểm tra nhặt Buff tại ô đích
    if (buffs && buffs[to.row] && buffs[to.row][to.col]) {
      collectedBuff = buffs[to.row][to.col];
      buffs[to.row][to.col] = null; // Ăn buff -> xoá khỏi ô cờ

      if (collectedBuff === BUFF_TYPES.SHIELD) {
        // Thêm mạng / Khiên hộ mệnh: cộng dồn tối đa 1 khiên
        movedPiece.shield = (movedPiece.shield || 0) + 1;
      } else if (collectedBuff === BUFF_TYPES.DOUBLE_STEP) {
        // Tốc hành: được đi 2 ô trong 2 lượt di chuyển tiếp theo của quân này
        movedPiece.doubleStepCharges = (movedPiece.doubleStepCharges || 0) + 2;
      } else if (collectedBuff === BUFF_TYPES.REVIVE) {
        // Hồi sinh đồng đội
        if (graveyard && graveyard[movedPiece.side] && graveyard[movedPiece.side].length > 0) {
          const pieceToRevive = graveyard[movedPiece.side].pop();
          pieceToRevive.shield = 0;
          pieceToRevive.doubleStepCharges = 0;
          const spawn = findSpawnPositionForSide(board, movedPiece.side);
          if (spawn) {
            board[spawn.row][spawn.col] = pieceToRevive;
            revivedPiece = pieceToRevive;
            revivePos = spawn;
          }
        } else if (teamBuffs && teamBuffs[movedPiece.side]) {
          // Chưa có quân tử trận -> tích trữ vé hồi sinh
          teamBuffs[movedPiece.side].reviveReserve = (teamBuffs[movedPiece.side].reviveReserve || 0) + 1;
        }
      }
    }

    return {
      movedPiece,
      capturedPiece,
      shieldDefended: false,
      collectedBuff,
      revivedPiece,
      revivePos,
      usedReviveReserve,
      pieceMoved: true
    };
  }

  /**
   * Sinh ngẫu nhiên 1 buff tại ô trống trung lập
   * @param {Array<Array<Object|null>>} board 
   * @param {Array<Array<string|null>>} buffs 
   * @returns {{pos: {row: number, col: number}, type: string}|null}
   */
  function spawnRandomBuff(board, buffs) {
    if (!buffs) return null;
    const candidates = [];
    for (let r = 2; r <= 6; r++) {
      for (let c = 1; c <= 7; c++) {
        if (!board[r][c] && !buffs[r][c]) {
          if ((r === BASES.RED.row && c === BASES.RED.col) || (r === BASES.BLUE.row && c === BASES.BLUE.col)) continue;
          candidates.push({ row: r, col: c });
        }
      }
    }

    if (candidates.length === 0) return null;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const types = [BUFF_TYPES.SHIELD, BUFF_TYPES.REVIVE, BUFF_TYPES.DOUBLE_STEP];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    buffs[chosen.row][chosen.col] = chosenType;

    return { pos: chosen, type: chosenType };
  }

  return {
    BOARD_SIZE,
    SIDES,
    PIECE_TYPES,
    BASES,
    DIRECTIONS,
    BEATS,
    BUFF_TYPES,
    BUFF_INFO,
    canCapture,
    isValidPosition,
    posToNotation,
    notationToPos,
    createInitialBoard,
    createInitialBuffs,
    cloneBuffs,
    findSpawnPositionForSide,
    applyMoveWithBuffs,
    spawnRandomBuff,
    getValidMoves,
    getAllValidMoves,
    countPieces,
    checkGameOver,
    cloneBoard
  };
}));
