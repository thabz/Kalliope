import client from '../tools/libs/elasticsearch-client.js';

describe('incremental anthology search updates', () => {
  it('deletes by the build entry even when the text belongs to another publication', () => {
    const remove = jest.spyOn(client, 'deleteByQuery').mockResolvedValue(null);
    try {
      client.deleteWork('test-index', 'author', 'antologier');
      expect(remove).toHaveBeenCalledWith('test-index', {
        term: { index_entry: 'author-antologier' },
      });
    } finally {
      remove.mockRestore();
    }
  });
});
