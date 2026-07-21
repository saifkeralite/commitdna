import * as vscode from "vscode";

/**
 * Built-in Git Extension
 */
export interface GitExtension {
    getAPI(version: 1): GitAPI;
}

/**
 * Git API
 */
export interface GitAPI {
    /**
     * All opened repositories
     */
    repositories: Repository[];

    /**
     * Fired when a repository is opened.
     */
    onDidOpenRepository?: vscode.Event<Repository>;

    /**
     * Fired when a repository is closed.
     */
    onDidCloseRepository?: vscode.Event<Repository>;
}

/**
 * Git Repository
 */
export interface Repository {
    rootUri: vscode.Uri;

    state: RepositoryState;
}

/**
 * Repository State
 */
export interface RepositoryState {
    /**
     * Current HEAD
     */
    HEAD?: Branch;

    /**
     * Files staged for commit
     */
    indexChanges: Change[];

    /**
     * Modified files
     */
    workingTreeChanges: Change[];

    /**
     * Merge changes
     */
    mergeChanges: Change[];

    /**
     * Repository changed
     */
    onDidChange: vscode.Event<void>;
}

/**
 * Git Branch
 */
export interface Branch {
    readonly name?: string;

    readonly commit?: string;
}

/**
 * File Change
 */
export interface Change {
    readonly uri: vscode.Uri;

    readonly originalUri?: vscode.Uri;

    readonly renameUri?: vscode.Uri;

    readonly status: Status;
}

/**
 * Git Status
 */
export enum Status {
    INDEX_MODIFIED = 0,

    INDEX_ADDED = 1,

    INDEX_DELETED = 2,

    INDEX_RENAMED = 3,

    INDEX_COPIED = 4,

    MODIFIED = 5,

    DELETED = 6,

    UNTRACKED = 7,

    IGNORED = 8,

    INTENT_TO_ADD = 9,

    INTENT_TO_RENAME = 10,

    TYPE_CHANGED = 11,

    ADDED_BY_US = 12,

    ADDED_BY_THEM = 13,

    DELETED_BY_US = 14,

    DELETED_BY_THEM = 15,

    BOTH_ADDED = 16,

    BOTH_DELETED = 17,

    BOTH_MODIFIED = 18,
}

export type GitConfigKey = "user.name" | "user.email";
export interface CommitReviewData {
    repositoryName: string;
    branchName: string;
    commitHash: string;
    repositoryPath: string;
    Author: string;
    Email: string;
}
