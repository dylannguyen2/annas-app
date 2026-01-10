alter table books 
  alter column rating type numeric(2,1),
  drop constraint if exists books_rating_check,
  add constraint books_rating_check check (rating >= 0.5 and rating <= 5);

alter table media 
  alter column rating type numeric(2,1),
  drop constraint if exists media_rating_check,
  add constraint media_rating_check check (rating >= 0.5 and rating <= 5);
