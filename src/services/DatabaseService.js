// DatabaseService.js
let initSqlJs;
import('sql.js').then(module => {
  initSqlJs = module.default;
});

class DatabaseService {
  static instance = null;

  constructor() {
    this.SQL = null;
    this.db = null;
    this.dbData = null;
    this.initialized = false;

  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.SQL = await initSqlJs({
        // Use local path relative to public directory
        locateFile: filename => `/sql.js/dist/${filename}`
      });
      this.initialized = true;
    } catch (error) {
      console.error('SQL.js initialization error:', error);
      throw new Error(`Failed to initialize SQL.js: ${error.message}`);
    }
  }

  async loadSQLDump(filePath, fileContent) {
    try {
      this.db = new this.SQL.Database();
      const sqlDump = new TextDecoder().decode(fileContent);
      
      // Split into statements, but handle multiline statements properly
      const statements = sqlDump
        .replace(/\/\*.*?\*\//gs, '') // Remove MySQL comments
        .replace(/^--.*$/gm, '')      // Remove single line comments
        .split(/;\s*$/m)
        .map(stmt => stmt.trim())
        .filter(stmt => {
          // Filter out MySQL-specific commands and empty statements
          const upper = stmt.toUpperCase();
          return stmt.length > 0 && 
            !upper.startsWith('SET ') &&
            !upper.startsWith('START TRANSACTION') &&
            !upper.startsWith('COMMIT') &&
            !upper.includes('/*!') &&
            !upper.startsWith('/*') &&
            !upper.startsWith('--');
        });
  
      // Track created tables
      const createdTables = new Set();
  
      // First pass: ONLY process CREATE TABLE statements
      for (const stmt of statements) {
        if (stmt.toUpperCase().includes('CREATE TABLE')) {
          try {
            // Extract table name for tracking
            const tableNameMatch = stmt.match(/CREATE\s+TABLE\s+[`"]?([^`"\s]+)[`"]?/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : null;
  
            // Convert MySQL CREATE TABLE syntax to SQLite
            let createStmt = stmt
              // Basic replacements
              .replace(/`/g, '"')
              .replace(/\s*ENGINE.*?;?$/gmi, ';')
              .replace(/AUTO_INCREMENT\s*,/gi, 'AUTOINCREMENT,')
              .replace(/AUTO_INCREMENT\s*\)/gi, 'AUTOINCREMENT)')
              
              // Data types
              .replace(/int\(\d+\)/gi, 'INTEGER')
              .replace(/bigint\(\d+\)/gi, 'INTEGER')
              .replace(/tinyint\(\d+\)/gi, 'INTEGER')
              .replace(/smallint\(\d+\)/gi, 'INTEGER')
              .replace(/mediumint\(\d+\)/gi, 'INTEGER')
              .replace(/varchar\(\d+\)/gi, 'TEXT')
              .replace(/char\(\d+\)/gi, 'TEXT')
              .replace(/tinytext/gi, 'TEXT')
              .replace(/mediumtext/gi, 'TEXT')
              .replace(/longtext/gi, 'TEXT')
              .replace(/text/gi, 'TEXT')
              .replace(/datetime/gi, 'TEXT')
              .replace(/timestamp/gi, 'TEXT')
              .replace(/double(\(\d+,\d+\))?/gi, 'REAL')
              .replace(/float(\(\d+,\d+\))?/gi, 'REAL')
              .replace(/decimal(\(\d+,\d+\))?/gi, 'REAL')
              .replace(/enum\([^)]+\)/gi, 'TEXT')
              
              // Remove problematic default values and constraints
              .replace(/DEFAULT\s+CURRENT_TIMESTAMP(\(\))?/gi, "DEFAULT (datetime('now'))")
              .replace(/DEFAULT\s+'0000-00-00 00:00:00'/gi, "DEFAULT '1970-01-01 00:00:00'")
              .replace(/\s+DEFAULT\s+NULL/gi, '')
              .replace(/UNSIGNED/gi, '')
              .replace(/CHARACTER\s+SET\s+[^ ,)]+/gi, '')
              .replace(/COLLATE\s+[^ ,)]+/gi, '')
              .replace(/DEFAULT\s+CHARSET\s*=\s*[^ ;]+/gi, '')
              
              // Clean up trailing commas and spaces
              .replace(/,(\s*\))/g, '$1')
              .replace(/\)\s*;?$/, ');');
  
            // Remove any remaining MySQL-specific stuff after the closing parenthesis
            createStmt = createStmt.replace(/\)[^;]*;/, ');');
  
            console.log('Creating table:', tableName);
            await this.db.exec(createStmt);
            
            if (tableName) {
              createdTables.add(tableName.replace(/^["'`]|["'`]$/g, ''));
            }
          } catch (err) {
            console.warn('Error in CREATE TABLE:', err);
            console.warn('Failed Statement:', stmt);
          }
        }
      }
  
      console.log('Created tables:', Array.from(createdTables));
  
      // Now handle inserts for created tables
      let insertCount = 0;
      for (const stmt of statements) {
        if (stmt.toUpperCase().includes('INSERT INTO')) {
          try {
            const tableNameMatch = stmt.match(/INSERT\s+INTO\s+[`"]?([^`"\s]+)[`"]?/i);
            const tableName = tableNameMatch ? tableNameMatch[1].replace(/^["'`]|["'`]$/g, '') : null;
  
            if (tableName && createdTables.has(tableName)) {
              let insertStmt = stmt
                .replace(/`/g, '"')
                .replace(/\\'/g, "''")
                .replace(/\\''/g, "''");
  
              await this.db.exec(insertStmt);
              insertCount++;
            }
          } catch (err) {
            console.warn('Error in INSERT:', err);
          }
        }
      }
  
      // Get table information
      const tables = [];
      for (const tableName of createdTables) {
        try {
          const columnsResult = await this.db.exec(`PRAGMA table_info("${tableName}")`);
          const countResult = await this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
  
          tables.push({
            name: tableName,
            rowCount: countResult[0].values[0][0],
            columns: columnsResult[0].values.map(col => col[1])
          });
        } catch (err) {
          console.warn(`Error getting info for table ${tableName}:`, err);
        }
      }
  
      if (tables.length === 0) {
        throw new Error('No tables could be created from the SQL dump');
      }
  
      return { tables, originalPath: filePath, type: 'sqlite' };
  
    } catch (error) {
      console.error('SQL dump load error:', error);
      throw error;
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
      
      // Store the loaded database data
      this.dbData = {
        originalPath: filePath,
        type: fileExt === 'json' ? 'json' : 'sqlite'
      };

      switch (fileExt) {
        case 'db':
        case 'sqlite':
        case 'sqlite3':
          return await this.loadSQLite(filePath, buffer);
        case 'json':
          return await this.loadJSON(filePath, buffer);
        case 'sql':
          return await this.loadSQLDump(filePath, buffer);
        default:
          throw new Error('Supported formats: SQLite (.db, .sqlite, .sqlite3), SQL dumps (.sql) and JSON');
      }
    } catch (error) {
      console.error('Database load error:', error);
      throw error;
    }
  }

  async loadSQLite(filePath, fileContent) {
    try {
      // Create a new database instance
      this.db = new this.SQL.Database(fileContent);

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