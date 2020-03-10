'use strict';

// to construct the string for table
const WithSchema = (schema, table) => (schema) ? `"${schema}"."${table}"` : `"${table}"`;
const functionForTrigger = "refresh_tags_summary_search";
const materialiazedViewName = "tags_by_exercise_state";

module.exports = {
  up: (queryInterface, Sequelize) => {
      // if using a schema
      let schema;
      if (queryInterface.sequelize.options.schema) {
          schema = queryInterface.sequelize.options.schema;
      }


      let query = `
        BEGIN;
            -- the MATERIALIZED VIEW
            
            CREATE MATERIALIZED VIEW ${WithSchema(schema, materialiazedViewName)}
            AS
                SELECT 
                    et."tag_id" AS "tag_id",
                    COUNT(*) FILTER (WHERE ex.state = 'DRAFT') AS "total_draft",
                    COUNT(*) FILTER (WHERE ex.state = 'PENDING') AS "total_pending",
                    COUNT(*) FILTER (WHERE ex.state = 'VALIDATED') AS "total_validated",
                    COUNT(*) FILTER (WHERE ex.state = 'NOT_VALIDATED') AS "total_not_validated",
                    COUNT(*) FILTER (WHERE ex.state = 'ARCHIVED') AS "total_archived"
                FROM "exercises_library"."Exercises" ex
                LEFT JOIN "exercises_library"."Exercises_Tags" et
                ON et."exercise_id" = ex.id
                GROUP BY et."tag_id"
            WITH DATA;
            
            -- index required for MATERIALIZED VIEW CONCURRENTLY 
            
            CREATE UNIQUE INDEX tags_by_exercise_state_tag_id
            ON ${WithSchema(schema, materialiazedViewName)}(tag_id);
            
            -- function for trigger
     
            CREATE OR REPLACE FUNCTION ${WithSchema(schema, functionForTrigger)}() RETURNS TRIGGER LANGUAGE plpgsql AS $$
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY ${WithSchema(schema, materialiazedViewName)};
                RETURN NULL;
            END $$;
            
            -- triggers
            
            CREATE TRIGGER auto_refresh_materialized_tag_view_1
            AFTER INSERT OR DELETE OR TRUNCATE
            ON ${WithSchema(schema, "Exercises_Tags")}
            FOR EACH STATEMENT
            EXECUTE PROCEDURE ${WithSchema(schema, functionForTrigger)}();

            CREATE TRIGGER auto_refresh_materialized_tag_view_2
            AFTER UPDATE OR DELETE OR TRUNCATE
            ON ${WithSchema(schema, "Exercises")}
            FOR EACH STATEMENT
            EXECUTE PROCEDURE ${WithSchema(schema, functionForTrigger)}();

            CREATE TRIGGER auto_refresh_materialized_tag_view_3
            AFTER INSERT OR DELETE OR TRUNCATE
            ON ${WithSchema(schema, "Tags")}
            FOR EACH STATEMENT
            EXECUTE PROCEDURE ${WithSchema(schema, functionForTrigger)}();
            
        COMMIT;
      `;

      return queryInterface.sequelize.query(query);
  },

  down: (queryInterface, Sequelize) => {
      // if using a schema
      let schema;
      if (queryInterface.sequelize.options.schema) {
          schema = queryInterface.sequelize.options.schema;
      }
      let query = `
        BEGIN;
            
            DROP TRIGGER IF EXISTS auto_refresh_materialized_tag_view_1 ON ${WithSchema(schema, "Exercises_Tags")};
            DROP TRIGGER IF EXISTS auto_refresh_materialized_tag_view_2 ON ${WithSchema(schema, "Exercises")};
            DROP TRIGGER IF EXISTS auto_refresh_materialized_tag_view_3 ON ${WithSchema(schema, "Tags")};
            
            DROP FUNCTION IF EXISTS ${WithSchema(schema, functionForTrigger)};
            DROP MATERIALIZED VIEW IF EXISTS ${WithSchema(schema, materialiazedViewName)};
            
        COMMIT;
      `;

      return queryInterface.sequelize.query(query);
  }
};
