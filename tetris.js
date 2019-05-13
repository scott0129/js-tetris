/* ------ Key Listener ------ */
document.body.onkeydown = function( e ) {
    var keys = {
        37: 'left',			//arrow keys
        39: 'right',
        40: 'down',
        38: 'rotate_R',
        88: 'rotate_R',	//x
        90: 'rotate_L',	//z
        32: 'drop'			//space
    };

    if ( typeof keys[ e.keyCode ] != 'undefined' ) {
      handle_key_press( keys[ e.keyCode ] );
    }
};

let canvas = document.getElementById('gameScreen');
let ctx = canvas.getContext('2d', {alpha: false});

const ROWS = 20;
const COLS = 10;

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const BLOCK_HEIGHT = CANVAS_HEIGHT/ROWS;
const BLOCK_WIDTH = CANVAS_WIDTH/COLS;

const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const COLORS = ['white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black'];

const PIECE_ENUM = {
	"I": 1,
	"O": 2,
	"T": 3,
	"S": 4, 
	"Z": 5,
	"J": 6,
	"L": 7
}

let game_board = []; //accessed [x][y] where top left corner is 0, 0
let piece_bag;
let current_piece;
let render_interval;
let gametick_interval;

function handle_key_press(key) {
	switch(key) {
		case 'left':
			attempt_move(-1, 0);
			break;
		case 'right':
			attempt_move(1, 0);
			break;
		case 'down':
			attempt_move(0, 1);
			break;
		case 'rotate_R':
			attempt_rotate_R();
			break;
		case 'rotate_L':
			attempt_rotate_L();
			break;
		case 'drop':
			//TODO
			break;
	}
	draw();
}

function attempt_move(del_x, del_y) {
	current_piece.move(del_x, del_y);
	
	if (!is_valid_position(current_piece)) {
		current_piece.move(-del_x, -del_y);
	}
}

function attempt_rotate_L() {
	current_piece.rotate_L();
	
	//If you can't rotate, shift over a bit and try again
	if (!is_valid_position(current_piece)) {
		if (current_piece.get_x() < COLS/2) {
			current_piece.move(1, 0);
			attempt_rotate_L;
		} else {
			current_piece.move(-1, 0);
			attempt_rotate_L;
		}
	}
}

function attempt_rotate_R() {
	current_piece.rotate_R();
	
	//If you can't rotate, shift over a bit and try again
	if (!is_valid_position(current_piece)) {
		if (current_piece.get_x() < COLS/2) {
			current_piece.move(1, 0);
			attempt_rotate_R;
		} else {
			current_piece.move(-1, 0);
			attempt_rotate_R;
		}
	}
}

/* returns:
 * 0 = is valid position
 * 1 = collided left wall
 * 2 = collided right wall
 * 3 = collided floor
 */
function is_invalid_position(piece) {
	let piece_x = piece.get_x();
	let piece_y = piece.get_y();

	let result = current_piece.get_shape().reduce( (acc, column, rel_x) => {
		return acc && column.reduce( (acc, is_present, rel_y) => {

			if (acc) {
				return acc;
			}

			let block_x = rel_x + piece_x;
			let block_y = rel_y + piece_y;

			if (is_present && (block_x >= COLS || block_x < 0 || block_y >= ROWS)) {
				return false;
			}
			return true;

		}, 0);
	}, 0);
	console.log(result);

	return result;
}

function Create_Piece_Bag() {
	return {
		get_piece: function() {
			let rand_num = Math.floor(Math.random() * 7);
			let piece = PIECES[rand_num];
			return Create_Piece(piece);
		}
	}
}

function Create_Piece(type) {
	let _x = 4;
	let _y = 2;

	let _type = type;
	let _orientation = 0;
	let _shape = PIECE_SHAPES[_type][_orientation];
	const possible_orientations = PIECE_SHAPES[_type].length;

	function get_x() {
		return _x;
	}

	function get_y() {
		return _y;
	}

	function get_shape() {
		return _shape;
	}

	function get_type() {
		return _type;
	}

	function move(del_x, del_y) {
		_x += del_x;
		_y += del_y;
	}

	function rotate_R() {
		_orientation += 1;
		_orientation %= possible_orientations;
		_shape = PIECE_SHAPES[_type][_orientation];
	}

	function rotate_L() {
		_orientation += 3;
		_orientation %= possible_orientations;
		_shape = PIECE_SHAPES[_type][_orientation];
	}

	return Object.freeze({
		get_x,
		get_y,
		get_shape,
		get_type,
		move,
		rotate_R,
		rotate_L
	})
}

function make_empty_board() {
	return Array.from(new Array(COLS), () => new Array(ROWS).fill(0));
}

function draw_block(x, y, piece_id) {
	ctx.fillStyle = COLORS[piece_id];
	ctx.fillRect( BLOCK_WIDTH * x, BLOCK_HEIGHT * y, BLOCK_WIDTH - 1 , BLOCK_HEIGHT - 1 );
  ctx.strokeRect( BLOCK_WIDTH * x, BLOCK_HEIGHT * y, BLOCK_WIDTH - 1 , BLOCK_HEIGHT - 1 );
}

function draw_board() {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw_piece() {
	let piece_x = current_piece.get_x();
	let piece_y = current_piece.get_y();
	let piece_type = PIECE_ENUM[current_piece.get_type()];
	current_piece.get_shape().forEach( (column, rel_x) => {
		column.forEach( (is_present, rel_y) => {
			if (is_present) {
				draw_block(piece_x + rel_x, piece_y + rel_y, piece_type);
			}
		});
	})
}

function tick() {
	//TODO: Move pieces and check for collision
	draw();
}

function setup() {
	game_board = make_empty_board();
	piece_bag = Create_Piece_Bag();
	current_piece = piece_bag.get_piece();
	interval = setInterval(tick, 500);
}

function draw() {
	draw_board();
	draw_piece();
}

setup();
draw();
console.log(game_board);

