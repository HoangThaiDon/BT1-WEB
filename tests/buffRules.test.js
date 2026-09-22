/**
 * Unit Tests for OTTv2 Buffs Mechanics
 * Kiểm thử toàn diện 3 loại Buff: Thêm Mạng, Hồi Sinh Đồng Đội, Đi 2 Ô
 */
const assert = require('assert');
const GameRules = require('../shared/gameRules');
const Board = require('../server/core/Board');

console.log('--- BẮT ĐẦU KIỂM THỬ HỆ THỐNG BUFFS ---');

// Test 1: Khởi tạo bàn cờ & bảng buffs ban đầu
console.log('1. Kiểm tra khởi tạo Buffs mặc định...');
const buffs = GameRules.createInitialBuffs();
assert.strictEqual(buffs.length, 9, 'Bảng buff phải có 9 hàng');
assert.strictEqual(buffs[0].length, 9, 'Mỗi hàng buff phải có 9 cột');

// Kiểm tra 6 buff đối xứng
assert.strictEqual(buffs[3][2], GameRules.BUFF_TYPES.SHIELD, 'c6 phải là SHIELD');
assert.strictEqual(buffs[3][4], GameRules.BUFF_TYPES.DOUBLE_STEP, 'e6 phải là DOUBLE_STEP');
assert.strictEqual(buffs[3][6], GameRules.BUFF_TYPES.REVIVE, 'g6 phải là REVIVE');

assert.strictEqual(buffs[5][2], GameRules.BUFF_TYPES.REVIVE, 'c4 phải là REVIVE');
assert.strictEqual(buffs[5][4], GameRules.BUFF_TYPES.DOUBLE_STEP, 'e4 phải là DOUBLE_STEP');
assert.strictEqual(buffs[5][6], GameRules.BUFF_TYPES.SHIELD, 'g4 phải là SHIELD');
console.log('✓ Test 1 Passed: 6 vị trí buff mặc định đối xứng chính xác!');

// Test 2: Cơ chế Thêm Mạng (Shield / Extra Life)
console.log('2. Kiểm tra Buff Thêm Mạng (Shield)...');
const board2 = new Board();
// Đặt 1 quân Đỏ tại ô hàng 5 cột 6 (g4 - nơi có buff SHIELD)
const redPiece = { id: 'r_test', type: GameRules.PIECE_TYPES.ROCK, side: GameRules.SIDES.RED };
board2.setPiece(6, 6, redPiece);

// Cho quân Đỏ di chuyển từ (6,6) vào (5,6) để nhặt Khiên
const moveRes = board2.movePiece(6, 6, 5, 6);
assert.strictEqual(moveRes.collectedBuff, GameRules.BUFF_TYPES.SHIELD, 'Phải nhặt được buff SHIELD');
assert.strictEqual(redPiece.shield, 1, 'Quân Đỏ phải có 1 khiên');
assert.strictEqual(board2.buffs[5][6], null, 'Buff trên ô cờ phải bị xoá');

// Thử tấn công quân Đỏ có khiên bằng quân Xanh Lá (Paper ăn Rock)
const bluePaper = { id: 'b_test', type: GameRules.PIECE_TYPES.PAPER, side: GameRules.SIDES.BLUE };
board2.setPiece(4, 6, bluePaper);

// Xanh tấn công từ (4,6) vào (5,6)
const attackRes = board2.movePiece(4, 6, 5, 6);
assert.strictEqual(attackRes.shieldDefended, true, 'Đòn tấn công phải bị khiên chặn');
assert.strictEqual(attackRes.capturedPiece, null, 'Quân Đỏ không bị ăn');
assert.strictEqual(redPiece.shield, 0, 'Khiên của quân Đỏ phải giảm về 0');
assert.strictEqual(board2.getPiece(5, 6), redPiece, 'Quân Đỏ vẫn phải còn sống tại ô (5,6)');
assert.strictEqual(board2.getPiece(4, 6), bluePaper, 'Quân Xanh bị bật lại tại ô (4,6)');
console.log('✓ Test 2 Passed: Khiên thêm mạng đỡ đòn chí mạng thành công!');

// Test 3: Cơ chế Hồi Sinh Đồng Đội (Revive)
console.log('3. Kiểm tra Buff Hồi Sinh Đồng Đội (Revive)...');
const board3 = new Board();
// Giả lập quân Đỏ đã mất 1 quân Kéo trong graveyard
const deadScissors = { id: 'r_dead', type: GameRules.PIECE_TYPES.SCISSORS, side: GameRules.SIDES.RED };
board3.graveyard.RED.push(deadScissors);

// Đặt 1 quân Đấm Đỏ tại (6,2) và di chuyển vào (5,2) (nơi có buff REVIVE)
const redRock = { id: 'r_walker', type: GameRules.PIECE_TYPES.ROCK, side: GameRules.SIDES.RED };
board3.setPiece(6, 2, redRock);

const reviveRes = board3.movePiece(6, 2, 5, 2);
assert.strictEqual(reviveRes.collectedBuff, GameRules.BUFF_TYPES.REVIVE, 'Phải nhặt được buff REVIVE');
assert.strictEqual(reviveRes.revivedPiece.id, deadScissors.id, 'Phải hồi sinh đúng quân tử trận');
assert.strictEqual(board3.graveyard.RED.length, 0, 'Graveyard phải hết quân');
assert.notStrictEqual(reviveRes.revivePos, null, 'Phải có vị trí hồi sinh');
assert.strictEqual(board3.getPiece(reviveRes.revivePos.row, reviveRes.revivePos.col).id, deadScissors.id, 'Quân hồi sinh phải nằm trên bàn cờ');

// Kiểm tra nếu graveyard rỗng -> nhận Vé Hồi Sinh Dự Trữ
const board3b = new Board();
const redRock2 = { id: 'r_walker2', type: GameRules.PIECE_TYPES.ROCK, side: GameRules.SIDES.RED };
board3b.setPiece(6, 2, redRock2);
const reviveReserveRes = board3b.movePiece(6, 2, 5, 2);
assert.strictEqual(board3b.teamBuffs.RED.reviveReserve, 1, 'Phải nhận 1 vé dự trữ hồi sinh khi graveyard rỗng');
console.log('✓ Test 3 Passed: Hồi sinh quân tử trận và vé dự trữ hoạt động chuẩn xác!');

// Test 4: Cơ chế Đi 2 Ô (Double Step / Speed)
console.log('4. Kiểm tra Buff Đi 2 Ô (Double Step)...');
const board4 = new Board();
const testPiece = { id: 'r_speedy', type: GameRules.PIECE_TYPES.ROCK, side: GameRules.SIDES.RED, doubleStepCharges: 1 };
// Đặt tại giữa bàn cờ (4,4)
board4.setPiece(4, 4, testPiece);

// Lấy danh sách nước đi
const validMoves = GameRules.getValidMoves(board4.grid, 4, 4);

// Kiểm tra có nước đi cự ly 1 ô và cự ly 2 ô
const step1Moves = validMoves.filter(m => m.step === 1);
const step2Moves = validMoves.filter(m => m.step === 2);

assert.strictEqual(step1Moves.length, 8, 'Phải có 8 nước đi 1 ô');
assert.strictEqual(step2Moves.length, 8, 'Phải có 8 nước đi 2 ô thẳng theo 8 hướng');

// Thử di chuyển 2 ô từ (4,4) đến (2,4) (hướng UP 2 bước)
const move2Res = board4.movePiece(4, 4, 2, 4);
assert.strictEqual(board4.getPiece(2, 4), testPiece, 'Quân cờ phải đến đúng ô (2,4)');
assert.strictEqual(board4.getPiece(4, 4), null, 'Ô cũ phải trống');
assert.strictEqual(testPiece.doubleStepCharges, 0, 'Charge đi 2 ô phải giảm về 0');
console.log('✓ Test 4 Passed: Tính toán và di chuyển nhảy 2 ô thành công!');

// Test 5: Tự động sinh ngẫu nhiên Buff
console.log('5. Kiểm tra hàm spawnRandomBuff...');
const board5 = new Board();
const spawned = GameRules.spawnRandomBuff(board5.grid, board5.buffs);
assert.notStrictEqual(spawned, null, 'Phải sinh được buff mới');
assert.ok(spawned.pos.row >= 2 && spawned.pos.row <= 6, 'Buff mới phải ở hàng trung lập (2-6)');
assert.ok([GameRules.BUFF_TYPES.SHIELD, GameRules.BUFF_TYPES.REVIVE, GameRules.BUFF_TYPES.DOUBLE_STEP].includes(spawned.type), 'Buff mới phải thuộc 3 loại');
console.log('✓ Test 5 Passed: Sinh ngẫu nhiên buff trung lập hoạt động tốt!');

console.log('\n🎉 TOÀN BỘ CÁC BÀI KIỂM THỬ BUFFS ĐỀU THÀNH CÔNG VÀ CHÍNH XÁC 100%!');
