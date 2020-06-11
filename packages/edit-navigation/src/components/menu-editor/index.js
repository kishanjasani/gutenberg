/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MenuEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';
import { useMenuItemsByClientId, useSaveMenuItems } from './use-menu-items';
import useCreateMissingMenuItems from './use-create-missing-menu-items';
import useNavigationBlockEditor, {
	useStubPost,
} from './use-navigation-block-editor';
import { useMemo } from '@wordpress/element';

// const DRAFT_POST_ID = 'navigation-post';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );

	const stubPostReady = useStubPost( query );
	const [ blocks, onInput, onChange, onCreated ] = useNavigationBlockEditor(
		query
	);
	const saveMenuItems = useSaveMenuItems( query );
	const save = () => onCreated( () => saveMenuItems( blocks ) );

	if ( ! stubPostReady ) {
		return <div>Loading...</div>;
	}

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ onInput }
				onChange={ onChange }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
					hasFixedToolbar: true,
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<MenuEditorShortcuts saveBlocks={ save } />
				<NavigationStructureArea
					blocks={ blocks }
					initialOpen={ isLargeViewport }
				/>
				<BlockEditorArea
					saveBlocks={ save }
					menuId={ menuId }
					onDeleteMenu={ onDeleteMenu }
				/>
			</BlockEditorProvider>
		</div>
	);
}
