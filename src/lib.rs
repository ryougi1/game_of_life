extern crate fixedbitset;
extern crate js_sys;
extern crate web_sys;

mod utils;

use fixedbitset::FixedBitSet;
use std::fmt;
use wasm_bindgen::prelude::*;
use web_sys::console;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// For JS console log
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

impl Universe {
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        //     for delta_row in [self.height - 1, 0, 1].iter().cloned() {
        //         for delta_col in [self.width - 1, 0, 1].iter().cloned() {
        //             if delta_row == 0 && delta_col == 0 {
        //                 continue;
        //             }

        //             let neighbor_row = (row + delta_row) % self.height;
        //             let neighbor_col = (column + delta_col) % self.width;
        //             let idx = self.get_index(neighbor_row, neighbor_col);
        //             count += self.cells[idx] as u8;
        //         }
        //     }
        //     count

        // Optimization: Use modulo as little as possible, allow CPU to predict branches better
        let north = if row == 0 { self.height - 1 } else { row - 1 };
        let south = if row == self.height - 1 { 0 } else { row + 1 };
        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };
        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;
        let n = self.get_index(north, column);
        count += self.cells[n] as u8;
        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;
        let w = self.get_index(row, west);
        count += self.cells[w] as u8;
        let e = self.get_index(row, east);
        count += self.cells[e] as u8;
        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;
        let s = self.get_index(south, column);
        count += self.cells[s] as u8;
        let se = self.get_index(south, east);
        count += self.cells[se] as u8;

        count
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn new(init_mode: &str, threshold: f64) -> Universe {
        utils::set_panic_hook(); // Enable better error messages if panic
                                 // panic!("AYAA");

        let width = 64;
        let height = 64;
        // let width = 128;
        // let height = 128;

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        match (init_mode, threshold) {
            ("random", threshold) => {
                log!("Generated random world with threshold {}", threshold);
                for i in 0..size {
                    if js_sys::Math::random() < threshold {
                        cells.set(i, false);
                    } else {
                        cells.set(i, true);
                    }
                }
            }
            _ => {
                log!("Generated default world");
                for i in 0..size {
                    cells.set(i, i % 2 == 0 || i % 7 == 0);
                }
            }
        }

        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn tick(&mut self) {
        // Have to use clone so state doesn't change from cell to cell
        let mut next = {
            let _timer = Timer::new("Allocating new cells");
            self.cells.clone()
        };

        // From the timer outputs in console, this part is almost full contributor
        // of all the time spent inside tick method
        {
            let _timer = Timer::new("New generation");
            for row in 0..self.height {
                for col in 0..self.width {
                    let idx = self.get_index(row, col);
                    let cell = self.cells[idx];
                    let live_neighbors = self.live_neighbor_count(row, col);

                    next.set(
                        idx,
                        match (cell, live_neighbors) {
                            (true, x) if x < 2 => false,
                            (true, 3) => true,
                            (true, x) if x > 3 => false,
                            (false, 3) => true,
                            (otherwise, _) => otherwise,
                        },
                    );
                }
            }
        }

        let _timer = Timer::new("Freeing old cells");
        self.cells = next;
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.cells.grow((width * self.height) as usize);
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.cells.grow((height * self.width) as usize);
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells
            .set(idx, if self.cells[idx] { false } else { true });
    }

    pub fn add_glider_at(&mut self, row: u32, col: u32) {
        // Set all cells to dead first
        for row in row - 1..row + 2 {
            for col in col - 1..col + 2 {
                self.cells.set((row * self.width + col) as usize, false);
            }
        }

        // Manually set the live cells
        for col in col - 1..col + 2 {
            self.cells.set((row * self.width + col) as usize, true);
        }
        self.cells
            .set(((row + 1) * self.width + col - 1) as usize, true);
        self.cells
            .set(((row + 2) * self.width + col) as usize, true);
    }

    pub fn add_glider(&mut self) {
        let random_offset: usize = (js_sys::Math::random() * self.width as f64) as usize;
        log!("Glider with offset {} coming through!", random_offset);

        // Set all cells to dead first
        for row in 0..5 {
            for col in 0..5 {
                self.cells
                    .set(row * self.width as usize + (col + random_offset), false);
            }
        }

        // Manually set the live cells
        self.cells
            .set(self.width as usize + (2 + random_offset), true);
        self.cells
            .set(self.width as usize * 2 + (3 + random_offset), true);
        for col in 1..4 {
            self.cells
                .set(self.width as usize * 3 + (col + random_offset), true);
        }
    }
}
