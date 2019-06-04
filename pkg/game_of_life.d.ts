/* tslint:disable */
/**
*/
export class Universe {
  free(): void;
  static new(init_mode: string, threshold: number): Universe;
  tick(): void;
  width(): number;
  height(): number;
  set_width(width: number): void;
  set_height(height: number): void;
  cells(): number;
  toggle_cell(row: number, col: number): void;
  add_glider_at(row: number, col: number): void;
  add_glider(): void;
}
