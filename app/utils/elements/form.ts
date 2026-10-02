import type { BuilderElement, StyleProperties } from '../../types/builder';
import type { ElementDefaults } from './elementDefaults';

const makeInput = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'input',
  name: 'Email',
  props: { type: 'email', name: 'email', placeholder: 'Your email address', label: 'Email', required: true },
  styles: {
    desktop: { width: '100%', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '14px', paddingRight: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', backgroundColor: '#ffffff', color: '#111827' },
    tablet: {},
    mobile: {},
    widescreen: { width: '100%', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '14px', paddingRight: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', backgroundColor: '#ffffff', color: '#111827' },
    laptop: { width: '100%', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '14px', paddingRight: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', backgroundColor: '#ffffff', color: '#111827' },
    mobileLandscape: {},
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

const makeButton = (): BuilderElement => ({
  id: `luniobuilder-${Math.random().toString(36).substr(2, 9)}`,
  type: 'button',
  name: 'Submit button',
  props: { text: 'Subscribe', type: 'submit' },
  styles: {
    desktop: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer' },
    tablet: {},
    mobile: {},
    widescreen: {},
    laptop: {},
    mobileLandscape: {},
  },
  children: [],
  parentId: null,
  locked: false,
  hidden: false,
});

export const getFormElementDefaults = (): ElementDefaults => ({
  name: 'Form',
  props: { formName: 'Newsletter signup', submitLabel: 'Subscribe', successMessage: 'Thanks for subscribing!', errorMessage: 'Unable to submit form. Please try again.' },
  styles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '480px',
    paddingTop: '32px',
    paddingBottom: '32px',
    paddingLeft: '32px',
    paddingRight: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
  } satisfies StyleProperties,
  children: [makeInput(), makeButton()],
});
