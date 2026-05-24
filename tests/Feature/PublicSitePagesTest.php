<?php

use Inertia\Testing\AssertableInertia as Assert;

test('public legal and support pages are available', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['terms', 'terms'],
    ['privacy-policy', 'privacy-policy'],
    ['privacy-notice', 'privacy-notice'],
    ['support', 'support'],
]);
