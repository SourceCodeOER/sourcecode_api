-- syntax pour drop une view
-- DROP VIEW [ IF EXISTS ] view_name;

-- Maybe use materialized view for performance
-- https://spin.atomicobject.com/2018/04/09/postgres-materialized-views/

 -- 1. base data for exercises
CREATE OR REPLACE VIEW exercises_library.Exercises_Basics_Data AS
SELECT ex.id as "exercise_id",
       ex.title,
       ex.description,
       ex.version,
       ex."createdAt",
       ex."updatedAt"
FROM exercises_library."Exercises" ex;

-- 2. exercises_with_authors
CREATE OR REPLACE VIEW exercises_library.Exercises_And_Author AS
SELECT ex.id as "exercise_id",
       json_build_object('user_id', u.id, 'fullName', u."fullName") AS "user"
FROM exercises_library."Exercises" ex
JOIN exercises_library."Users" u
ON ex.user_id = u.id;

-- 3. other data of exercises
CREATE OR REPLACE VIEW exercises_library.Exercises_Advanced_Data AS
SELECT em.exercise_id,
       json_agg(json_build_object('vote_count', em.vote_count, 'vote_score', em.avg_vote_score)) AS "metrics",
       array_to_json(array_agg(json_build_object('tag_id', tt.id, 'text', tt.text, 'kind', tc.kind))) AS "tags"
FROM exercises_library."Exercises_Metrics" em
JOIN exercises_library."Exercises_Tags" et ON et.exercise_id = em.exercise_id
JOIN exercises_library."Tags" tt ON tt.id = et.tag_id
JOIN exercises_library."Tag_Categories" tc ON tt.category_id = tc.id
GROUP BY em.exercise_id;