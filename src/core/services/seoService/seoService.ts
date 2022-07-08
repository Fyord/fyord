import { Strings } from 'tsbase/System/Strings';
import { MetaTag } from './metaTag';
import { MetaTagNames } from './metaTagNames';

export interface ISeoService {
  SetDefaultTags(title?: string, description?: string, imageUrl?: string): void;
  SetTitle(title: string): void;
  SetDescription(description: string): void;
  SetImageUrl(imageUrl: string): void;
  SetMetaTags(metaTags: Array<MetaTag>): void;
}

export class SeoService implements ISeoService {
  private static instance: ISeoService | null = null;
  public static get Instance(): ISeoService {
    return this.instance || (this.instance = new SeoService());
  }
  public static Destroy = () => SeoService.instance = null;

  private originalTitle: string;
  private originalDescription = Strings.Empty;
  private originalImageUrl = Strings.Empty;

  private constructor() {
    this.originalTitle = document.title.indexOf('|') < 0 ?
      document.title : document.title.split('|')[1].trim();
    this.setOriginalMetaTags();
  }

  public SetTitle(title: string): void {
    if (title !== this.originalTitle) {
      document.title = `${title} | ${this.originalTitle}`;
    } else {
      document.title = this.originalTitle;
    }
  }

  public SetDescription(description: string): void {
    this.updateMetaTag(MetaTagNames.Description, description);
  }

  public SetImageUrl(imageUrl: string): void {
    this.updateMetaTag(MetaTagNames.ImageUrl, imageUrl);
  }

  public SetMetaTags(metaTags: Array<MetaTag>): void {
    metaTags.forEach(element => {
      this.updateMetaTag(element.Name, element.Content);
    });
  }

  public SetDefaultTags(
    title: string | null = null,
    description: string | null = null,
    imageUrl: string | null = null
  ): void {
    title ? this.SetTitle(title) : this.SetTitle(this.originalTitle);
    description ? this.SetDescription(description) : this.SetDescription(this.originalDescription);
    imageUrl ? this.SetImageUrl(imageUrl) : this.SetImageUrl(this.originalImageUrl);
  }

  private setOriginalMetaTags() {
    const descriptionMetaTag = this.getMetaTag(MetaTagNames.Description);
    if (descriptionMetaTag) {
      this.originalDescription = descriptionMetaTag.content;
    }

    const imageUrlMetaTag = this.getMetaTag(MetaTagNames.ImageUrl);
    if (imageUrlMetaTag) {
      this.originalImageUrl = imageUrlMetaTag.content;
    }
  }

  private updateMetaTag(name: string, content: string) {
    const metaTagToUpdate = this.getMetaTag(name);
    if (metaTagToUpdate) {
      (metaTagToUpdate as HTMLMetaElement).content = content;
    } else {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.append(meta);
    }
  }

  private getMetaTag(name: string): HTMLMetaElement | null {
    const metaTag = document.querySelector(`meta[name='${name}']`);
    if (metaTag) {
      return metaTag as HTMLMetaElement;
    } else {
      return null;
    }
  }
}
