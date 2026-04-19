import config from '../data/config.json';

describe('SKU config mapping', () => {
  it('should include brands, categories, and mapping entries', () => {
    expect(Array.isArray(config.brands)).toBe(true);
    expect(typeof config.categories).toBe('object');
    expect(typeof config.mapping).toBe('object');
    expect(config.brands.length).toBeGreaterThan(0);
    expect(Object.keys(config.categories).length).toBeGreaterThan(0);
    expect(Object.keys(config.mapping).length).toBeGreaterThan(0);
  });

  it('should resolve a known mapped location', () => {
    const brand = 'Damson Madder';
    const category = 'top';
    const mapped = config.mapping[brand]?.[category]?.[0];

    expect(mapped).toBeTruthy();
  });
});
