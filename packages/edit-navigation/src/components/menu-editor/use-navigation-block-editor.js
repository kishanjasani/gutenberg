/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useMemo, useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useCreateNavigationBlock from './use-navigation-blocks';
import { useFetchMenuItems } from './use-menu-items';

export const DRAFT_POST_ID = 'navigation-post';

export function useStubPost( query ) {
	const menuItems = useFetchMenuItems( query );
	const createNavigationBlock = useCreateNavigationBlock();
	const initialBlocks = useMemo( () => createNavigationBlock( menuItems ), [
		menuItems,
	] );

	const { receiveEntityRecords } = useDispatch( 'core' );
	const [ hydrated, setHydrated ] = useState( false );

	useEffect( () => {
		if ( ! initialBlocks?.innerBlocks?.length ) {
			setHydrated( false );
			return;
		}
		if ( hydrated ) {
			return;
		}
		console.log( 'initialBlocks 2', [ initialBlocks ] );
		receiveEntityRecords(
			'root',
			'postType',
			[
				{
					id: DRAFT_POST_ID,
					slug: DRAFT_POST_ID,
					generated_slug: DRAFT_POST_ID,
					status: 'draft',
					type: 'page',
					blocks: [ initialBlocks ],
				},
			],
			null,
			false
		).then( () => {
			setHydrated( true );
		} );
	}, [ initialBlocks ] );

	return hydrated;
}

export default function useNavigationBlockEditor() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType',
		{ id: DRAFT_POST_ID }
	);

	return [ blocks, onInput, onChange ];
}
