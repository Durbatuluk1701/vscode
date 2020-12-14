/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI, UriComponents } from 'vs/base/common/uri';
import { IWindowState as IWindowUIState } from 'vs/platform/windows/electron-main/windows';
import { IWorkspaceIdentifier } from 'vs/platform/workspaces/common/workspaces';

export type WindowsStateStorageData = object;

export interface IWindowState {
	workspace?: IWorkspaceIdentifier;
	folderUri?: URI;
	backupPath?: string;
	remoteAuthority?: string;
	uiState: IWindowUIState;
}

export interface IWindowsState {
	lastActiveWindow?: IWindowState;
	lastPluginDevelopmentHostWindow?: IWindowState;
	openedWindows: IWindowState[];
}

interface ISerializedWindowsState {
	readonly lastActiveWindow?: ISerializedWindowState;
	readonly lastPluginDevelopmentHostWindow?: ISerializedWindowState;
	readonly openedWindows: ISerializedWindowState[];
}

interface ISerializedWindowState {
	readonly workspaceIdentifier?: { id: string; configURIPath: string };
	readonly folder?: string;
	readonly backupPath?: string;
	readonly remoteAuthority?: string;
	readonly uiState: IWindowUIState;

	// deprecated
	readonly folderUri?: UriComponents;
	readonly folderPath?: string;
	readonly workspace?: { id: string; configPath: string };
}

export function restoreWindowsState(data: WindowsStateStorageData | undefined): IWindowsState {
	const result: IWindowsState = { openedWindows: [] };
	const windowsState = data as ISerializedWindowsState || { openedWindows: [] };

	if (windowsState.lastActiveWindow) {
		result.lastActiveWindow = restoreWindowState(windowsState.lastActiveWindow);
	}

	if (windowsState.lastPluginDevelopmentHostWindow) {
		result.lastPluginDevelopmentHostWindow = restoreWindowState(windowsState.lastPluginDevelopmentHostWindow);
	}

	if (Array.isArray(windowsState.openedWindows)) {
		result.openedWindows = windowsState.openedWindows.map(windowState => restoreWindowState(windowState));
	}

	return result;
}

function restoreWindowState(windowState: ISerializedWindowState): IWindowState {
	const result: IWindowState = { uiState: windowState.uiState };
	if (windowState.backupPath) {
		result.backupPath = windowState.backupPath;
	}

	if (windowState.remoteAuthority) {
		result.remoteAuthority = windowState.remoteAuthority;
	}

	if (windowState.folder) {
		result.folderUri = URI.parse(windowState.folder);
	} else if (windowState.folderUri) {
		result.folderUri = URI.revive(windowState.folderUri);
	} else if (windowState.folderPath) {
		result.folderUri = URI.file(windowState.folderPath);
	}

	if (windowState.workspaceIdentifier) {
		result.workspace = { id: windowState.workspaceIdentifier.id, configPath: URI.parse(windowState.workspaceIdentifier.configURIPath) };
	} else if (windowState.workspace) {
		result.workspace = { id: windowState.workspace.id, configPath: URI.file(windowState.workspace.configPath) };
	}

	return result;
}

export function getWindowsStateStoreData(windowsState: IWindowsState): WindowsStateStorageData {
	return {
		lastActiveWindow: windowsState.lastActiveWindow && serializeWindowState(windowsState.lastActiveWindow),
		lastPluginDevelopmentHostWindow: windowsState.lastPluginDevelopmentHostWindow && serializeWindowState(windowsState.lastPluginDevelopmentHostWindow),
		openedWindows: windowsState.openedWindows.map(ws => serializeWindowState(ws))
	};
}

function serializeWindowState(windowState: IWindowState): ISerializedWindowState {
	return {
		workspaceIdentifier: windowState.workspace && { id: windowState.workspace.id, configURIPath: windowState.workspace.configPath.toString() },
		folder: windowState.folderUri && windowState.folderUri.toString(),
		backupPath: windowState.backupPath,
		remoteAuthority: windowState.remoteAuthority,
		uiState: windowState.uiState
	};
}
