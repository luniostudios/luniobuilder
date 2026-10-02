import type { BuilderElement, StyleProperties } from '../../types/builder';

export interface ElementDefaults {
  name: string;
  props: BuilderElement['props'];
  styles: StyleProperties;
  children?: BuilderElement[];
}