---
title: "Text-Objects!"
description: "A deep dive into Vim's text objects and operators, showing how to edit text at a higher level of abstraction with fewer keystrokes."
date: 2015-03-21
tags: ["vim", "productivity", "text-editors", "text-objects"]
---

<p>This is one of those Vim posts that I promised I'd write, but just never ended up writing. Until today.</p>
<p>I'm going to talk about editing text using a combination of operators, text objects and motion commands. Most people using Vim probably already use these a fair bit, so it's probably not going to be very useful for them, but in case someone does want to read up, here it is without further ado!</p>
<p>Let's start out talking about how Vim edit commands are constructed:</p>
<p>A typical edit command can be broken down like this</p>
<pre><code>[&lt;repititions&gt;]([&lt;operator&gt;][&lt;text-object&gt;/&lt;motion&gt;])</code></pre>
<p>I'll explain each bit over the course of this blog post, but here's a super short summary:</p>
<ul>
<li><strong><em>repititions</em></strong>: Number of times you want to repeat the following edit instruction.</li>
<li><strong><em>operator</em></strong>: These are the basic operations you can perform on text, such as copy, yank, delete.<br /> <em>(See :h operator)</em></li>
<li><strong><em>textobject</em></strong>: These are the basic units of text/code that Vim understands.<br /> <em>(See :h text-objects)</em></li>
<li><strong><em>motion</em></strong>: These are the basic movements to navigate text in Vim.<br /> <em>(See :h {motion})</em></li><br />
</ul>
<p>I'm not going to talk about <code>motion</code> commands much, and I'm not going to talk about<code>repetitions</code> at all.</p>
<p>Instead let us focus on <code>text-objects.</code></p>
<h2 id="text-objects">Text Objects</h2>
<p>Text objects are the smallest or most basic constructs that Vim understands. Unlike other text editors, Vim is <a href="http://vim.sexy/">smart</a>.</p>
<p>It understands quite a few natural language constructs, such as words, sentences, paragraphs. It also understands some programming language constructs, namely, blocks, strings, tags among others.</p>
<p>What this means is you can talk to your editor at a higher level of abstraction instead of simply communicating with it at the awkward and unnatural character level.</p>
<p>So you can now say:<br /><em>"Hey Vim, can you copy this paragraph for me?"</em><br />Or<br /><em>"This C function is bullcrap! Get rid of it!"</em></p>
<p>Vim will typically do things like for you in 3 keystrokes.</p>
<p>No more holding down the backspace to delete a line.<br />No more switching to visual mode, selecting your text/code and then copying/deleting it.<br />No more "I want to change the text I'm printing" and then holding down the delete key and then typing the new string all over.</p>
<p>But before we starting <em>Operating</em> on Text Objects, we need to learn to identify them.</p>
<p>A text object is of the form:</p>
<pre><code>[&lt;an&gt;/&lt;inner&gt;][some abstraction]</code></pre>
<p>The <code>&lt;inner&gt;</code> prefix in some general selects the <em>'inside'</em> of whatever abstraction follows after it. What <em>'inside'</em> means varies for language constructs and programming constructs, but it makes sense on the whole, as we'll see in the examples.</p>
<p>The <code>&lt;an&gt;</code>, or as I initially incorrectly called it the 'all', prefix is used to select an entire unit of the abstraction. What <em>entire unit</em> means again varies for language constructs and programming constructs, but hopefully the examples that follow will serve as a clarification and demonstration.</p>
<p>Now that that's cleared up, what are these <em>abstractions</em> that I've been harping on about? There's a ton of them, here follows a brief list of the ones I use commonly:</p>
<pre><code>w   word
s   sentence
p   paragraph
"   A quoted string. Pair of corresponding ".
    Works for single quotes too. (Use ')
[   A [] block. Pair of corresponding [ ].
(   A () block. Pair of corresponding ( ).
{   A {} block. Pair of corresponding { }.
t   HTML/XML tags</code></pre>
<p>There are other more powerful ones in <a href="http://vimdoc.sourceforge.net/htmldoc/motion.html#text-objects">there</a>, but lets focus on these for now.</p>
<p>The best way to show you the power of these things it to literally <strong><em>show</em></strong> it to you.</p>
<p>So this is the basic text we start out with:</p>
<div class="figure">
<img src="http://content.ffledgling.com/blog/vim-text-objects/basic-text.gif" alt="Base Text" />
<p class="caption">Base Text</p><br />
</div>
<p>As some of you might recognise, it's a simple C program.</p>
<p>Now, this is the text we'll continuously modify and change in our examples.</p>
<p>Let's start out small and delete a word we don't need. In the sentence <code>"This is not a setence I want not to write\n"</code>, we have double negatives tying the programs users in (k)nots.</p>
<p>To get rid of it, we navigate towards it, and then with a flash we do a <strong>daw</strong> <em>(delete 'an' word)</em> to remove the word. We immediately undo the change and then use <strong>diw</strong> <em>(delete 'inner' word)</em> . Is there a noticeable difference? Play close attention to what happens to the whitespace around the word after deletion in both cases. <strong>daw</strong> modifies surrounding whitespace, whereas <strong>diw</strong> does not touch the surrounding whitespace.</p>
<div class="figure">
<img src="http://content.ffledgling.com/blog/vim-text-objects/daw-diw.gif" alt="delete-'an'-word and delete-'inner'-word" />
<p class="caption"><code>delete-'an'-word</code> <em>and</em> <code>delete-'inner'-word</code></p><br />
</div>
<p>Not impressive you say? Okay.</p>
<p>How about we decide to get rid of the useless <code>(int argc, char* argv[])</code> bit? We aren't really parsing CLI arguments, and have no need for it.</p>
<p>Three keystrokes, <strong>di(</strong> <em>(delete 'inside' ( )</em>, to wipe that bit clean. Neat eh?</p>
<div class="figure">
<img src="http://content.ffledgling.com/blog/vim-text-objects/di-parens.gif" alt="delete-inside-(" />
<p class="caption"><code>delete-inside-(</code></p><br />
</div>
<p>Now how about you decide to re-write an entire crappily written C function? What do you do? You want to nuke it from orbit ofcourse. The only question is how do you do it?</p>
<p>Do you got into insert mode and hold down the space bar? Or maybe you hit <strong>dd</strong> multiple times to fix all this.</p>
<p>No need, <strong>ci{</strong> <em>(change 'inside' {)</em> at your service.</p>
<div class="figure">
<img src="http://content.ffledgling.com/blog/vim-text-objects/ci-function.gif" alt="change-inside-{" />
<p class="caption"><code>change-inside-{</code></p><br />
</div>
<p>This removes the old contents of your <code>{}</code> block, which happens to be a C function, and places the cursor in the next line at the correct indent level in insert mode, ready and waiting for you.</p>
<p>An interesting bit about text objects is that you can define your own. In other words you can <em>teach</em> Vim newer, shinier text-objects. You can also stand on the shoulders of other and use plugins like <a href="http://www.vim.org/scripts/script.php?script_id=3037">this</a>.</p>
<h2 id="operators">Operators</h2>
<p>Any Vim user probably uses a subset of the operators available in Vim on a close to daily basis. The fairly common ones are <strong>Y</strong><em>ank</em>, <strong>D</strong><em>elete</em>, <strong>C</strong><em>hange</em>. These are probably by far the most useful as well.</p>
<p>Here's a complete list copied from Vim's help:</p>
<pre><code>c   change
d   delete
y   yank into register (does not change the text)
~   swap case (only if 'tildeop' is set)
g~  swap case
gu  make lowercase
gU  make uppercase
!   filter through an external program
=   filter through 'equalprg' or C-indenting if empty
gq  text formatting
g?  ROT13 encoding
&gt;   shift right
&lt;   shift left
zf  define a fold
g@  call function set with the 'operatorfunc' option</code></pre>
<p>Operators are really handy because they let you think about editing as a set of higher level operations such as <em>delete something</em> or <em>copy something</em> instead of thinking about it terms of removing or deleting and re-typing a <em>sequence of characters</em> all over again.</p>
<h2 id="take-away">Take-Away</h2>
<p>Combine the various operators and text-objects in creative ways to make your own life easier. After a while using text-objects becomes second nature. This reduces the micro-interruptions while entering text or code. So you can now think about your higher level writing or code instead of thinking about all those extra key-presses you need to get there. Also <em>less typing</em> hurray!</p>
<h2 id="additional-reading">Additional reading</h2>
<ol style="list-style-type: decimal">
<li>More in-depth treatment, still in blog form<br /> <a href="http://blog.carbonfive.com/2011/10/17/vim-text-objects-the-definitive-guide/">http://blog.carbonfive.com/2011/10/17/vim-text-objects-the-definitive-guide/</a><br /></li>
<li>Vim Documentation, Text Objects<br /> <a href="http://vimdoc.sourceforge.net/htmldoc/motion.html#text-objects">http://vimdoc.sourceforge.net/htmldoc/motion.html#text-objects</a><br /></li>
<li>Vim Documentation, Operators<br /> <a href="http://vimdoc.sourceforge.net/htmldoc/motion.html#operator">http://vimdoc.sourceforge.net/htmldoc/motion.html#operator</a><br /></li>
<li>Vim Documentation, Motion<br /> <a href="http://vimdoc.sourceforge.net/htmldoc/motion.html">http://vimdoc.sourceforge.net/htmldoc/motion.html</a></li><br />
</ol>
