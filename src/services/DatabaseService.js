// DatabaseService.js
import initSqlJs from 'sql.js/dist/sql-wasm.js';

class DatabaseService {
  static instance = null;

  constructor() {
    this.SQL = null;
    this.db = null;
    this.dbData = null;
  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize() {
    if (!this.SQL) {
      try {
        this.SQL = await initSqlJs({
          locateFile: file => `/sql.js/dist/${file}`
        });
      } catch (error) {
        console.error('SQL.js initialization error:', error);
        throw new Error('Failed to initialize SQL.js');
      }
    }
  }

  async loadDatabase(filePath, fileContent) {
    try {
      await this.initialize();
      
      // Convert ArrayBuffer to Uint8Array if needed
      const buffer = fileContent instanceof Uint8Array ? 
        fileContent : 
        new Uint8Array(fileContent);

      const fileExt = filePath.split('.').pop()?.toLowerCase();

      switch (fileExt) {
        case 'db':
        case 'sqlite':
        case 'sqlite3':
          return await this.loadSQLite(filePath, buffer);
        case 'json':
          return await this.loadJSON(filePath, buffer);
        default:
          throw new Error('Supported formats: SQLite (.db, .sqlite, .sqlite3) and JSON');
      }
    } catch (error) {
      console.error('Database load error:', error);
      throw error;
    }
  }

  async loadSQLite(filePath, fileContent) {
    try {
      this.db = new this.SQL.Database(new Uint8Array(fileContent));

      // Get all tables
      const tablesResult = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const tables = [];

      if (tablesResult.length > 0) {
        for (const row of tablesResult[0].values) {
          const tableName = row[0];
          const columnsResult = this.db.exec(`PRAGMA table_info("${tableName}")`);
          const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);

          tables.push({
            name: tableName,
            rowCount: countResult[0].values[0][0],
            columns: columnsResult[0].values.map(col => col[1])
          });
        }
      }

      return {
        tables,
        originalPath: filePath,
        type: 'sqlite'
      };
    } catch (error) {
      console.error('SQLite load error:', error);
      throw new Error('Failed to load SQLite database: ' + error.message);
    }
  }

  async loadJSON(filePath, fileContent) {
    try {
      const content = new TextDecoder().decode(fileContent);
      const data = JSON.parse(content);

      const tables = Object.entries(data).map(([name, rows]) => ({
        name,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        columns: Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : []
      }));

      return {
        tables,
        originalPath: filePath,
        type: 'json'
      };
    } catch (error) {
      console.error('JSON load error:', error);
      throw new Error('Failed to load JSON file: ' + error.message);
    }
  }

  async getTableData(tableName, page = 0, pageSize = 100) {
    if (!this.db || !this.dbData) {
      throw new Error('No database loaded');
    }

    try {
      switch (this.dbData.type) {
        case 'sqlite': {
          const result = this.db.exec(
            `SELECT * FROM "${tableName}" LIMIT ${pageSize} OFFSET ${page * pageSize}`
          );

          if (result.length === 0) return { columns: [], rows: [] };

          const columns = result[0].columns;
          const rows = result[0].values.map(row =>
            Object.fromEntries(columns.map((col, i) => [col, row[i]]))
          );

          return { columns, rows, originalData: rows };
        }

        case 'json': {
          // Handle JSON data
          return {
            columns: this.dbData.tables.find(t => t.name === tableName).columns,
            rows: [],  // Implement JSON data handling
            originalData: []
          };
        }

        default:
          throw new Error(`Unsupported database type: ${this.dbData.type}`);
      }
    } catch (error) {
      console.error('Error getting table data:', error);
      throw new Error('Failed to get table data: ' + error.message);
    }
  }

  async saveChanges(tableName, changes) {
    if (!this.db || !this.dbData) {
      throw new Error('No database loaded');
    }

    try {
      this.db.exec('BEGIN TRANSACTION');

      for (const change of changes) {
        const { rowIndex, columnId, value } = change;
        const safeValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        
        this.db.exec(`UPDATE "${tableName}" SET "${columnId}" = ${safeValue} WHERE rowid = ${rowIndex + 1}`);
      }

      this.db.exec('COMMIT');

      // Export the database
      const data = this.db.export();
      const blob = new Blob([data.buffer], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.dbData.originalPath.split('/').pop()}_updated`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      this.db.exec('ROLLBACK');
      console.error('Error saving changes:', error);
      throw new Error('Failed to save changes: ' + error.message);
    }
  }
}

export const databaseService = DatabaseService.getInstance();