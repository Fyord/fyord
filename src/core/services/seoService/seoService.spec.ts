/**
 * @jest-environment jsdom
 */

import { SeoService } from './seoService';
import { MetaTagNames } from './metaTagNames';
import { MetaTag } from './metaTag';

describe('SeoService', () => {
  let classUnderTest: SeoService;

  beforeEach(() => {
    SeoService.Destroy();
    document.title = 'originalTitle';
    classUnderTest = SeoService.Instance;
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
    expect(classUnderTest['originalTitle']).toEqual('originalTitle');
  });

  it('should construct with a piped title', () => {
    SeoService.Destroy();
    document.title = 'original | title';
    classUnderTest = SeoService.Instance;
    expect(classUnderTest).toBeDefined();
    expect(classUnderTest['originalTitle']).toEqual('title');
  });

  it('should set the document title', () => {
    classUnderTest.SetTitle('test');
    expect(document.title).toEqual('test | originalTitle');
  });

  it('should set the document description when no corresponding meta tag exists', () => {
    classUnderTest.SetDescription('test');
    const metaTag = document.querySelector(`meta[name='${MetaTagNames.Description}']`);
    expect(metaTag && (metaTag as HTMLMetaElement).content === 'test').toBeTruthy();
  });

  it('should set the document description when a corresponding meta tag does exist', () => {
    classUnderTest.SetDescription('test');
    const metaTag = document.querySelector(`meta[name='${MetaTagNames.Description}']`);
    expect(metaTag && (metaTag as HTMLMetaElement).content === 'test').toBeTruthy();
  });

  it('should set the document og:image', () => {
    classUnderTest.SetImageUrl('test');
    const metaTag = document.querySelector(`meta[name='${MetaTagNames.ImageUrl}']`);
    expect(metaTag && (metaTag as HTMLMetaElement).content === 'test').toBeTruthy();
  });

  it('should set multiple meta tags', () => {
    const metaTags = new Array<MetaTag>();
    metaTags.push({ Name: MetaTagNames.Description, Content: 'test' });
    metaTags.push({ Name: MetaTagNames.ImageUrl, Content: 'test' });

    classUnderTest.SetMetaTags(metaTags);
    const imageMetaTag = document.querySelector(`meta[name='${MetaTagNames.ImageUrl}']`);
    const descriptionMetaTag = document.querySelector(`meta[name='${MetaTagNames.Description}']`);

    expect(imageMetaTag && (imageMetaTag as HTMLMetaElement).content === 'test').toBeTruthy();
    expect(descriptionMetaTag && (descriptionMetaTag as HTMLMetaElement).content === 'test').toBeTruthy();
  });

  it('should set default tags to original values when no overrides given', () => {
    classUnderTest.SetDefaultTags();
    expect(document.title).toEqual('originalTitle');
  });

  it('should set default tags to given values', () => {
    classUnderTest.SetDefaultTags('test', 'test', 'test');
    const metaTag = document.querySelector(`meta[name='${MetaTagNames.Description}']`);

    expect(document.title).toEqual('test | originalTitle');
    expect(metaTag && (metaTag as HTMLMetaElement).content === 'test').toBeTruthy();
  });

});
