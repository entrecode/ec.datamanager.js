export declare namespace DataManager {
  export interface DataManager {
    constructor(options: dmOptions);

    getFileUrl(assetID: string, locale?: string): Promise<string>;

    getImageUrl(assetID: string, size?: number, locale?: string): Promise<string>;

    getImageThumbUrl(assetID: string, size?: number, locale?: string): Promise<string>;

    resolve(): Promise<DataManager>;

    modelList(): Promise<any>;

    enableCache(models: string | Array<string>, env: env, maxCacheAge?: number): Promise<any>;

    clearCache(): Promise<any>;

    model(title: string, metadata: any): Model.Model;

    assetList(options?: any): AssetList;

    assets(options?: any): Array<Asset.Asset>;

    asset(assetID: string): Asset.Asset;

    createAsset(input: any): Array<Promise<Asset.Asset>>;

    tagList(options?: any): TagList;

    tags(options?: any): Array<Tag.Tag>;

    tag(tag: string): Tag.Tag;

    registerAnonymous(validUntil: string): Promise<User.User>;

    account(): Promise<User.User>;

    getAuthLink(relation: string, templateParameter: any): Promise<string>;

    emailAvailable(email: string): Promise<boolean>;

    can(permission: string): Promise<boolean>;

    logout(): void;
  }

  export function getFileUrl(assetID: string, locale?: string): Promise<string>;

  export function getImageUrl(assetID: string, size?: number, locale?: string): Promise<string>;

  export function getImageThumbUrl(assetID: string, size?: number, locale?: string): Promise<string>;

  export function cloneEntry(entry: Entry.Entry): Entry.Entry;

  export function cloneEntries(entries: Array<Entry.Entry>): Array<Entry.Entry>;

  export function cloneAsset(asset: Asset.Asset): Asset.Asset;

  export function cloneAssets(assets: Array<Asset.Asset>): Array<Asset.Asset>;

  export function cloneTag(tag: Tag.Tag): Tag.Tag;

  export function cloneTags(tags: Array<Tag.Tag>): Array<Tag.Tag>;

  export const DB_NODEJS: string;

  export const DB_CORDOVA: string;

  export const DB_BROWSER: string;
}

export declare function DataManager(options: dmOptions): void;

export default DataManager;

export declare namespace Asset {
  export interface Asset {
    save(): Promise<Asset>;

    delete(): Promise<boolean>;

    getFileUrl(locale?: string): Promise<string>;

    getImageUrl(size?: number, locale?: string): Promise<string>;

    getImageThumbUrl(size?: number, locale?: string): Promise<string>;

    clone(): Entry.Entry;
  }
}

export declare function Asset(asset: any, dm: DataManager.DataManager): void;

export declare namespace Entry {
  export interface Entry {
    save(): Promise<Entry>;

    delete(): Promise<boolean>;

    getTitle(property: string): string;

    getModelTitle(property: string): string;
  }
}

export declare function Entry(entry: any, dm: DataManager.DataManager, model: Model.Model): void;

export declare namespace Model {
  export interface Model {
    enableCache(env: env, maxCacheAge?: number): Promise<any>;

    clearCache(): Promise<any>;

    resolve(): Promise<Model>;

    getSchema(): Promise<any>;

    entryList(options?: any): Promise<EntryList>;

    entries(options?: any): Promise<Array<Entry.Entry>>;

    entry(id: any, levels: number): Promise<Entry.Entry>;

    nestedEntry(id: any, levels: number): Promise<Entry.Entry>;

    createEntry(entry: any): Promise<Entry.Entry>;

    deleteEntry(entryId: string): Promise<boolean>;
  }
}

export declare function Model(title: string, metadata: any, dm: DataManager.DataManager): void;

export declare namespace Tag {
  export interface Tag {
    save(): Promise<Tag>;

    delete(): Promise<boolean>;
  }
}

export declare function Tag(tag: any, dm: DataManager.DataManager, traversal: any): void;

export declare namespace User {
  export interface User {
    logout(): Promise<void>;

    isAnonymous(): boolean;

    isAnon(): boolean;
  }
}

export declare function User(isAnon: boolean, user: any, dm: DataManager.DataManager): void;

export type dmOptions = { url?: string, id?: string, accessToken?: string, clientID?: string, errorHandler?: (error: Error) => {} };

export type env = 'NODEJS' | 'CORDOVA' | 'BROWSER';

export type AssetList = { assets: Array<Asset.Asset>, count: number, total: number }

export type TagList = { tags: Array<Tag.Tag>, count: number, total: number }

export type EntryList = { entries: Array<Entry.Entry>, count: number, total: number }
