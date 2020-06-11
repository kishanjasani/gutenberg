/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MenuEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';
import { useSaveMenuItems } from './use-menu-items';
import useNavigationBlockEditor, {
	useStubPost,
} from './use-navigation-block-editor';
import { useMemo } from '@wordpress/element';

// const DRAFT_POST_ID = 'navigation-post';

export default function MenuEditorWrapper( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );
	const stubPostReady = useStubPost( query );

	if ( ! stubPostReady ) {
		return <div>Loading...</div>;
	}

	return (
		<MenuEditor
			blockEditorSettings={ blockEditorSettings }
			onDeleteMenu={ onDeleteMenu }
			query={ query }
			menuId={ menuId }
		/>
	);
}

const MenuEditor = ( {
	query,
	menuId,
	blockEditorSettings,
	onSaveMenu,
	onDeleteMenu,
} ) => {
	const [ blocks, onInput, onChange ] = useNavigationBlockEditor();
	// const createMissingMenuItems =

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => onInput( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => {
					// createMissingMenuItems( updatedBlocks );
					onChange( updatedBlocks );
				} }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
					hasFixedToolbar: true,
				} }
			>
				<MenuEditorProviderContents
					menuId={ menuId }
					query={ query }
					blocks={ blocks }
					onSaveMenu={ onSaveMenu }
					onDeleteMenu={ onDeleteMenu }
				/>
			</BlockEditorProvider>
		</div>
	);
};

const MenuEditorProviderContents = ( {
	query,
	blocks,
	menuId,
	onDeleteMenu,
} ) => {
	const isLargeViewport = useViewportMatch( 'medium' );
	const saveMenuItems = useSaveMenuItems( query ); // eventuallySaveMenuItems( blocks );
	return (
		<>
			<BlockEditorKeyboardShortcuts />
			<MenuEditorShortcuts saveBlocks={ saveMenuItems } />
			<NavigationStructureArea
				blocks={ blocks }
				initialOpen={ isLargeViewport }
			/>
			<BlockEditorArea
				saveBlocks={ saveMenuItems }
				menuId={ menuId }
				onDeleteMenu={ onDeleteMenu }
			/>
		</>
	);
};
