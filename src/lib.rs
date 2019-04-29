extern crate fixedbitset;
extern crate js_sys;

mod utils;

use fixedbitset::FixedBitSet;
// use std::fmt;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Import console.log() from JS
#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
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
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[idx] as u8;
            }
        }
        count
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

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

        self.cells = next;
    }

    pub fn new(init_mode: &str, threshold: f64) -> Universe {
        let width = 64;
        let height = 64;

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        match (init_mode, threshold) {
            ("random", threshold) => {
                let log_msg = format!("Generated random world with threshold {}", threshold);
                log(&log_msg);
                for i in 0..size {
                    if js_sys::Math::random() < threshold {
                        cells.set(i, false);
                    } else {
                        cells.set(i, true);
                    }
                }
            }
            _ => {
                let log_msg = format!("Generated default world");
                log(&log_msg);
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

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn add_glider(&mut self) {
        log("Glider coming through!");
        let random_offset: usize = (js_sys::Math::random() * 40.0) as usize;
        log_u32(random_offset as u32);
        // Set all cells to dead first
        for row in 0..5 {
            for col in 0..5 {
                self.cells
                    .set(row * self.width() as usize + (col + random_offset), false); // First row
            }
        }

        // Manually set the live cells
        self.cells
            .set(self.width() as usize + (2 + random_offset), true);
        self.cells
            .set(self.width() as usize * 2 + (3 + random_offset), true);
        for col in 1..4 {
            self.cells
                .set(self.width() as usize * 3 + (col + random_offset), true);
        }
    }
}
