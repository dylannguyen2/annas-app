alter table meals add column if not exists photo_urls text[] default '{}';

update meals 
set photo_urls = array[photo_url]::text[] 
where photo_url is not null and (photo_urls is null or photo_urls = '{}');
