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
			tick();
			break;
		case 'rotate_R':
			attempt_rotate_R();
			break;
		case 'rotate_L':
			attempt_rotate_L();
			break;
		case 'drop':
			solidify(get_ghost_piece(current_piece));
			current_piece = piece_bag.get_piece();
			break;
	}
	draw();
}


function attempt_move(del_x, del_y) {
	current_piece.move(del_x, del_y);
	
	if (is_invalid_position(current_piece)) {
		current_piece.move(-del_x, -del_y);
	}
}

function attempt_rotate_L() {
	current_piece.rotate_L();
	
	let position_validity = is_invalid_position(current_piece);
	if (position_validity) {
		current_piece.rotate_R();
	}

	//If you can't rotate, shift over a bit and try again
	//TODO: This doesn't work very well when it hits other blocks
	//For now, if you can't don't.
	/*
	switch(position_validity) {
		case 1:
			current_piece.rotate_R();
			current_piece.move(1, 0);
			attempt_rotate_L();
			break;
		case 2:
			current_piece.rotate_R();
			current_piece.move(-1, 0);
			attempt_rotate_L();
			break;
		case 3:
			current_piece.rotate_R();
			current_piece.move(0, -1);
			attempt_rotate_L();
			break;
	}
	*/
}

function attempt_rotate_R() {
	current_piece.rotate_R();
	
	let position_validity = is_invalid_position(current_piece);
	if (position_validity) {
		current_piece.rotate_L();
	}
	//If you can't rotate, shift over a bit and try again
	//TODO: This doesn't work very well when it hits other blocks
	//For now, if you can't don't.
	/*
	switch(position_validity) {
		case 1:
			current_piece.rotate_L();
			current_piece.move(1, 0);
			attempt_rotate_R();
			break;
		case 2:
			current_piece.rotate_L();
			current_piece.move(-1, 0);
			attempt_rotate_R();
			break;
		case 3:
			current_piece.rotate_L();
			current_piece.move(0, -1);
			attempt_rotate_R();
			break;
	}
	*/
}

//TODO: Try to make this into a single higher order function
/* returns:
 * 0 = is valid position
 * 1 = collided left wall
 * 2 = collided right wall
 * 3 = collided floor
 * 4 = collided with other blocks
 */
function is_invalid_position(piece) {
	let piece_x = piece.get_x();
	let piece_y = piece.get_y();

	let result = current_piece.get_shape().reduce( (acc, column, rel_x) => {
		return acc || column.reduce( (acc, is_present, rel_y) => {

			if (acc) {
				return acc;
			}

			let block_x = rel_x + piece_x;
			let block_y = rel_y + piece_y;

			if (is_present) {
				if (block_x < 0) {
					return 1;
				}
				if (block_x >= COLS) {
					return 2;
				}
				if (block_y >= ROWS) {
					return 3;
				}
				if (block_y >= 0 && game_board[block_x][block_y] != 0) {
					return 4;
				}
			}
			return 0;

		}, 0);
	}, 0);

	return result;
}

function Create_Piece_Bag() {
	return {
		get_piece: function() {
			//TODO: Have some better ordering
			//TODO: Show next pieces
			let rand_num = Math.floor(Math.random() * 7);
			let piece = PIECES[rand_num];
			return Create_Piece(3, -3, piece, 0);
		}
	}
}

function Create_Piece(x, y, type, orientation) {
	let _x = x;
	let _y = y;

	let _type = type;
	let _orientation = orientation;
	let _shape = PIECE_SHAPES[_type][_orientation];
	const possible_orientations = PIECE_SHAPES[_type].length;

	function get_x() {
		return _x;
	}

	function get_y() {
		return _y;
	}

	function get_orientation() {
		return _orientation;
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
		get_orientation,
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

function draw_ghost_block(x, y) {
	ctx.strokeStyle = 'orange';
  ctx.strokeRect( BLOCK_WIDTH * x, BLOCK_HEIGHT * y, BLOCK_WIDTH - 1 , BLOCK_HEIGHT - 1 );
}

function draw_block(x, y, piece_id) {
	ctx.fillStyle = COLORS[piece_id];
	ctx.fillRect( BLOCK_WIDTH * x, BLOCK_HEIGHT * y, BLOCK_WIDTH - 1 , BLOCK_HEIGHT - 1 );
	ctx.strokeStyle = 'black';
  ctx.strokeRect( BLOCK_WIDTH * x, BLOCK_HEIGHT * y, BLOCK_WIDTH - 1 , BLOCK_HEIGHT - 1 );
}

//TODO: reorganize this hacky function
function delete_full_rows() {
	let full_rows = game_board.reduce( (mask, column) => {
		return column.map( (item, idx) => {
			return item && mask[idx]
		});

	}, new Array(ROWS).fill(1))

	full_rows.reduceRight( ( _ , is_full_row, idx) => {
		console.log('bool', is_full_row);
		console.log('idx', idx);
		if (is_full_row) {
			game_board.forEach( (column) => column.splice(idx, 1));
		}
	}, 0)

	full_rows.reduceRight( ( _ , is_full_row, idx) => {
		if (is_full_row) {
			game_board.forEach( (column) => column.unshift(0));
		}
	}, 0)

}

function draw_board() {
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = 'black';
	ctx.strokeRect(0, 0, canvas.width, canvas.height);
	game_board.forEach( (column, x) => {
		column.forEach( (piece_id, y) => {
			if (piece_id != 0) {
				draw_block(x, y, piece_id);
			}
		});
	})
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

function solidify(piece) {
	let piece_x = piece.get_x();
	let piece_y = piece.get_y();
	let piece_type = PIECE_ENUM[piece.get_type()];
	current_piece.get_shape().forEach( (column, rel_x) => {
		column.forEach( (is_present, rel_y) => {
			if (is_present) {
				game_board[piece_x + rel_x][piece_y + rel_y] = piece_type;
			}
		});
	})
}
	

function tick() {
	//TODO: Move pieces and check for collision
	current_piece.move(0, 1);
	if(is_invalid_position(current_piece)) {
		current_piece.move(0, -1);
		solidify(current_piece);
		current_piece = piece_bag.get_piece();
	}
	clearInterval(gametick_interval);
	gametick_interval = setInterval(tick, 500);
	delete_full_rows();
	draw();
}

function setup() {
	game_board = make_empty_board();
	piece_bag = Create_Piece_Bag();
	current_piece = piece_bag.get_piece();
	//TODO: Difficulty Scaling & Score
	gametick_interval = setInterval(tick, 500);
}

function get_airspace_of_col(x) {
	let column = game_board[x];
	let height = 0;
	while (height < ROWS && column[height] === 0) {
		height++;
	}
	return height - 1;
}

//TODO: Doesn't handle the piece being under overhangs
function get_ghost_piece(piece) {
	let piece_x = piece.get_x();
	let piece_y = piece.get_y();
	let orientation = piece.get_orientation();
	let piece_type = piece.get_type();
	let largest_ys = piece.get_shape().reduce( (largest_ys, column) => {
		let largest_y_in_column = column.reduce( (largest_y, is_present, rel_y) => {
			if (is_present && rel_y > largest_y) {
				return rel_y;
			}
			return largest_y;
		}, -3);

		largest_ys.push(largest_y_in_column);
		return largest_ys;
	}, []);

	let dist_to_ground = Math.min(...(largest_ys.map((y_coord, idx) => {
		if (piece_x + idx < 0 || piece_x + idx >= COLS) {
			return 20;
		}
		return get_airspace_of_col(piece_x + idx) - y_coord - piece_y;
	})));

	return Create_Piece(piece_x, piece_y + dist_to_ground, piece_type, orientation);
}

//TODO: Combine this with draw_piece
function draw_ghost() {
	let ghost = get_ghost_piece(current_piece);
	let piece_x = ghost.get_x();
	let piece_y = ghost.get_y();
	current_piece.get_shape().forEach( (column, rel_x) => {
		column.forEach( (is_present, rel_y) => {
			if (is_present) {
				draw_ghost_block(piece_x + rel_x, piece_y + rel_y);
			}
		});
	})
}



function draw() {
	draw_board();
	draw_ghost();
	draw_piece();
}


setup();

