words = Word.find( :all, :select => "written_form", :conditions => "language='English'")
words.map! { |w| w.written_form.downcase.strip.gsub("  ", " ") }
words = words.inject( [] ) { |s, e| s += e.split(" ") }
words.uniq!
words.sort!

words.map! { |w| w.downcase }
words.uniq!
words.sort!

File.open('public/javascripts/vinova/data/english_single_words.json', 'w') do |f|
  f.print 'words = ['
  for w in words do
    f.print "\"#{w}\","
  end
  f.print "''];"
end