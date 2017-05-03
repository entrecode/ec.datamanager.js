declare namespace DataManager {
  export interface DataManager {
    constructor(options: dmOptions);

    getFileUrl(assetID: string, locale?: string): Promise<string>;

    getImageUrl(assetID: string, size?: number, locale?: string): Promise<string>;

    getImageThumbUrl(assetID: string, size?: number, locale?: string): Promise<string>;

    resolve(): Promise<DataManager>;

    modelList(): Promise<any>;

    enableCache(models: string | Array<string>, env: env, maxCacheAge?: number): Promise<any>;

    clearCache(): Promise<any>;

    model(title: string, metadata: any): Model;

    assetList(options?: any): AssetList;

    assets(options?: any): Array<Asset>;

    asset(assetID: string): Asset;

    createAsset(input: any): Array<Promise<Asset>>;

    tagList(options?: any): TagList;

    tags(options?: any): Array<Tag>;

    tag(tag: string): Tag;

    registerAnonymous(validUntil: string): Promise<User>;

    account(): Promise<User>;

    getAuthLink(relation: string, templateParameter: any): Promise<string>;

    emailAvailable(email: string): Promise<boolean>;

    can(permission: string): Promise<boolean>;

    logout(): void;
  }

  export function getFileUrl(assetID: string, locale?: string): Promise<string>;

  export function getImageUrl(assetID: string, size?: number, locale?: string): Promise<string>;

  export function getImageThumbUrl(assetID: string, size?: number, locale?: string): Promise<string>;

  export function cloneEntry(entry: Entry): Entry;

  export function cloneEntries(entries: Array<Entry>): Array<Entry>;

  export function cloneAsset(asset: Asset): Asset;

  export function cloneAssets(assets: Array<Asset>): Array<Asset>;

  export function cloneTag(tag: Tag): Tag;

  export function cloneTags(tags: Array<Tag>): Array<Tag>;

  export const DB_NODEJS: string;

  export const DB_CORDOVA: string;

  export const DB_BROWSER: string;

  export interface Asset {
    save(): Promise<Asset>;

    delete(): Promise<boolean>;

    getFileUrl(locale?: string): Promise<string>;

    getImageUrl(size?: number, locale?: string): Promise<string>;

    getImageThumbUrl(size?: number, locale?: string): Promise<string>;

    clone(): Entry;
  }

  export function Asset(asset: any, dm: DataManager): void;

  export interface Entry {
    save(): Promise<Entry>;

    delete(): Promise<boolean>;

    getTitle(property: string): string;

    getModelTitle(property: string): string;
  }

  export function Entry(entry: any, dm: DataManager, model: Model): void;

  export interface Model {
    enableCache(env: env, maxCacheAge?: number): Promise<any>;

    clearCache(): Promise<any>;

    resolve(): Promise<Model>;

    getSchema(): Promise<any>;

    entryList(options?: any): Promise<EntryList>;

    entries(options?: any): Promise<Array<Entry>>;

    entry(id: any, levels: number): Promise<Entry>;

    nestedEntry(id: any, levels: number): Promise<Entry>;

    createEntry(entry: any): Promise<Entry>;

    deleteEntry(entryId: string): Promise<boolean>;
  }

  export function Model(title: string, metadata: any, dm: DataManager): void;

  export interface Tag {
    save(): Promise<Tag>;

    delete(): Promise<boolean>;
  }

  export function Tag(tag: any, dm: DataManager, traversal: any): void;

  export interface User {
    logout(): Promise<void>;

    isAnonymous(): boolean;

    isAnon(): boolean;
  }

  export function User(isAnon: boolean, user: any, dm: DataManager): void;

  export type dmOptions = { url?: string, id?: string, accessToken?: string, clientID?: string, errorHandler?: (error: Error) => {} };

  export type env = 'NODEJS' | 'CORDOVA' | 'BROWSER';

  export type AssetList = { assets: Array<Asset>, count: number, total: number }

  export type TagList = { tags: Array<Tag>, count: number, total: number }

  export type EntryList = { entries: Array<Entry>, count: number, total: number }

}

declare function DataManager(options: DataManager.dmOptions): void;

export = DataManager;
