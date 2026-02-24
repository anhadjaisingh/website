---
title: "The not so Sedentary Second Week"
description: "The second week of GSoC wraps up with work on Moznetwork and Mozinstall, battling cross-platform issues along the way."
date: 2013-07-03
tags:
  [
    "gsoc",
    "mozilla",
    "mozinstall",
    "moznetwork",
    "operating systems",
    "regular expression",
  ]
---

<p><a href="{{site.url}}/media/blog-2.jpg"><img class=" wp-image" id="i-221" alt="Image" src="{{site.url}}/media/blog-2.jpg" width="167" height="166" /></a></p>
<p>The second week came to an end, and with it's end comes a new post.</p>
<p>If I were to describe how last week went, I'd describe it as a mixed bag.<br />
The modules due for test writing last week were Moznetwork and Mozinstall.</p>
<p>While working with Mozinstall over&nbsp;the past week I've often found myself at a loss for expletives to dish out to the "other" two Operating Systems &nbsp;I was working with&nbsp;( Yes Windows and Mac I'm looking at you).<br />
Eventually though, I realized that they're not as bad as I originally thought they were.Thanks to help from jhammel, wlach, ahal, Mook and Google,&nbsp;I learnt a bit about how installers are packaged for MacOSX and Windows,&nbsp;and how these installers can be stubbed (i.e fake <em>installers </em>that don't actually install anything, rather they just go through the <em>motions</em> of the install procedure).<br />
The amount of relief I felt after actually getting the installers working and the tests for mozinstall running is indescribable.</p>
<p>The other module I was supposed to work on last week was Moznetwork. I have some fond memories with Moznetwork, it was the first (and only :P ) module I wrote for Mozilla.<br />
This was fun to test, I knew most of the code and testing involved regular expressions which I enjoy, so it was loads of fun. (Here's <a href="http://www.debuggex.com/i/rP_qIsaXNUMJePAc.png">the one I used</a>&nbsp;)</p>
<p>As always you can track progress for there modules on their respective Bugs.</p>
<p>Mozinstall - <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=796017">Bug&nbsp;796017</a><br />
Moznetwork - <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=853127">Bug&nbsp;853127<br />
</a>I also ended up doing some minuscule fixes that I stumbled across during testing, these were <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=888741">Bug&nbsp;888741</a>&nbsp;and <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=888756">Bug&nbsp;888756</a>&nbsp;.</p>
