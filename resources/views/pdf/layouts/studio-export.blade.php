<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Export')</title>
    @include('pdf.partials.studio-export-styles')
    @stack('styles')
</head>
<body>
    @include('pdf.partials.studio-export-header')
    @yield('content')
    @include('pdf.partials.studio-export-footer')
</body>
</html>
