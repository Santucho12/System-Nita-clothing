import { useState, useMemo } from 'react';

/**
 * Hook para manejar el ordenado dinámico de tablas.
 * @param {Array} items - Los datos a ordenar.
 * @param {Object} config - Configuración inicial del ordenado { key: string, direction: 'ascending' | 'descending' }.
 */
const useSortableData = (items, config = null) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejo de tipos dinámicos si se provee keyTypes
                if (sortConfig.keyTypes && sortConfig.keyTypes[sortConfig.key]) {
                    const type = sortConfig.keyTypes[sortConfig.key];
                    if (type === 'number') {
                        aValue = Number(aValue) || 0;
                        bValue = Number(bValue) || 0;
                    } else if (type === 'date') {
                        aValue = new Date(aValue).getTime() || 0;
                        bValue = new Date(bValue).getTime() || 0;
                    }
                }

                // Manejar valores nulos o indefinidos
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'ascending'
        ) {
            direction = 'descending';
        }
        // Preservamos keyTypes al cambiar la dirección
        setSortConfig({ ...sortConfig, key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};

export default useSortableData;
